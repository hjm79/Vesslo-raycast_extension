#!/usr/bin/env python3
"""Forward an exact extension URL through the verified TestHost private inbox."""

import argparse
import base64
import datetime
import hashlib
import importlib.util
import json
import os
import posixpath
import re
import stat
import sys
import time
import unicodedata
import uuid

DRIVER_PATH = "/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/script/raycast_native_review.py"
MAX_URL = 32 * 1024
MAX_PAYLOAD = 24 * 1024
TARGET_KEYS = {"appId", "bundleId", "canonicalPath", "caskToken", "installedVersion", "expectedTargetVersion"}
REQUEST_KEYS = {"schemaVersion", "requestId", "publisherSessionId", "createdAt", "inventoryRevision", "completedCheckRevision", "source", "targets"}
READINESS_REQUIRED_KEYS = {"target", "source", "state", "publisherSessionId", "checkRevision", "inventoryRevision"}
READINESS_OPTIONAL_KEYS = {"evidenceId", "checkedAt", "expiresAt", "reason"}


class TransportError(Exception):
    pass


def require(value, reason):
    if not value:
        raise TransportError(reason)


def load_driver(path, expected_hash):
    require(path == DRIVER_PATH and os.path.realpath(path) == path, "Unexpected or noncanonical driver path")
    require(re.fullmatch(r"[0-9a-f]{64}", expected_hash) is not None, "Invalid driver SHA256")
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC)
    try:
        before = os.fstat(descriptor)
        require(stat.S_ISREG(before.st_mode) and before.st_nlink == 1 and before.st_uid == os.getuid()
                and before.st_mode & 0o022 == 0 and before.st_size <= 256 * 1024, "Unsafe driver file")
        source = bytearray()
        while len(source) <= 256 * 1024:
            chunk = os.read(descriptor, min(65536, 256 * 1024 + 1 - len(source)))
            if not chunk:
                break
            source.extend(chunk)
        after = os.fstat(descriptor)
        linked = os.stat(path, follow_symlinks=False)
        signature = lambda value: (value.st_dev, value.st_ino, value.st_nlink, value.st_uid, value.st_mode, value.st_size, value.st_mtime_ns, value.st_ctime_ns)
        require(signature(before) == signature(after) == signature(linked) and len(source) == before.st_size,
                "Driver changed during read")
    finally:
        os.close(descriptor)
    require(hashlib.sha256(source).hexdigest() == expected_hash, "Driver SHA256 mismatch")
    spec = importlib.util.spec_from_file_location("vesslo_verified_native_driver", path)
    require(spec is not None, "Cannot load driver")
    module = importlib.util.module_from_spec(spec)
    # Compile the already verified bytes; an import loader reopening the path would race the hash check.
    exec(compile(bytes(source), path, "exec"), module.__dict__)
    return module


def uuid_value(value):
    require(isinstance(value, str) and re.fullmatch(r"[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}", value), "Invalid UUID")
    return str(uuid.UUID(value))


def revision(value):
    require(type(value) is int and 0 <= value <= 9007199254740991, "Invalid revision")
    return value


def target_identity(value, request_version=None):
    keys = TARGET_KEYS | ({"readinessEvidenceId"} if request_version == 2 else set())
    require(isinstance(value, dict) and set(value) == keys, "Invalid target fields")
    if request_version == 2:
        uuid_value(value["readinessEvidenceId"])
    app_id = uuid_value(value["appId"])
    for key in TARGET_KEYS - {"appId"}:
        text = value[key]
        require(isinstance(text, str) and 0 < len(text.encode("utf-8")) <= 4096
                and not any(unicodedata.category(char) in {"Cc", "Cf", "Cs"} for char in text), "Invalid target text")
    path = value["canonicalPath"]
    require(path.startswith("/VessloSynthetic/") and not path.startswith("//")
            and path.endswith(".app") and posixpath.normpath(path) == path, "Non-synthetic or noncanonical target path")
    require(value["bundleId"].startswith("invalid.vesslo.nativefixture."), "Non-synthetic Bundle ID")
    require(re.fullmatch(r"vesslo-fixture-[a-z0-9][a-z0-9@._+\-]*", value["caskToken"]) is not None,
            "Non-synthetic cask")
    return (app_id, value["bundleId"], path, value["caskToken"], value["installedVersion"], value["expectedTargetVersion"])


def date_value(value):
    require(isinstance(value, str) and len(value) <= 64 and re.fullmatch(
        r"\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)", value), "Invalid date")
    return datetime.datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()


def target_readiness(metadata, targets, now):
    entries = metadata.get("homebrewReadiness")
    require(isinstance(entries, list) and len(entries) <= 10000, "Missing or oversized readiness evidence")
    completed_at = date_value(metadata.get("lastUpdateCheckAt"))
    require(completed_at <= now + 30, "Completed check is in the future")
    app_ids, evidence_ids, ready = set(), set(), {}
    for entry in entries:
        require(isinstance(entry, dict) and READINESS_REQUIRED_KEYS <= set(entry)
                and set(entry) <= READINESS_REQUIRED_KEYS | READINESS_OPTIONAL_KEYS,
                "Invalid readiness fields")
        identity = target_identity(entry["target"])
        require(identity[0] not in app_ids, "Duplicate readiness target")
        app_ids.add(identity[0])
        require(entry["source"] == "homebrew" and entry["state"] in {"ready", "failed", "unverified"},
                "Invalid readiness source or state")
        require(uuid_value(entry["publisherSessionId"]) == uuid_value(metadata["publisherSessionId"])
                and revision(entry["checkRevision"]) == revision(metadata["checkRevision"])
                and revision(entry["inventoryRevision"]) == revision(metadata["inventoryRevision"]),
                "Readiness differs from live epoch")
        evidence_id = entry.get("evidenceId")
        if evidence_id is not None:
            evidence_id = uuid_value(evidence_id)
            require(evidence_id not in evidence_ids, "Duplicate readiness evidence")
            evidence_ids.add(evidence_id)
        if entry["state"] == "ready":
            require(evidence_id is not None and entry.get("reason") is None, "Invalid ready evidence")
            checked_at, expires_at = date_value(entry.get("checkedAt")), date_value(entry.get("expiresAt"))
            require(0 < expires_at - checked_at <= 900 and checked_at <= completed_at + 30,
                    "Invalid readiness lifetime or check time")
            if checked_at <= now + 30 and expires_at > now:
                ready[identity] = evidence_id
        else:
            expected_reason = "sourceFailed" if entry["state"] == "failed" else "sourceUnverified"
            require(entry.get("reason") == expected_reason
                    and evidence_id is None and entry.get("checkedAt") is None and entry.get("expiresAt") is None,
                    "Invalid unavailable readiness evidence")
    for target in targets:
        require(ready.get(target_identity(target, 2)) == uuid_value(target["readinessEvidenceId"]),
                "Selected target has no matching current readiness evidence")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, "Duplicate JSON key")
        result[key] = value
    return result


def decode_exact_url(data, manifest, now=None):
    require(isinstance(data, bytes) and 0 < len(data) <= MAX_URL, "Invalid URL byte length")
    url = data.decode("ascii")
    matched = re.fullmatch(r"vesslo://review-homebrew/v([12])\?payload=([A-Za-z0-9_-]+)", url)
    require(matched is not None, "URL is not canonical unpadded Homebrew review transport")
    version = int(matched.group(1))
    token = matched.group(2)
    payload = base64.b64decode(token + "=" * (-len(token) % 4), altchars=b"-_", validate=True)
    require(len(payload) <= MAX_PAYLOAD and base64.urlsafe_b64encode(payload).rstrip(b"=").decode() == token,
            "Invalid or oversized base64url payload")
    def invalid_constant(_value):
        raise TransportError("Non-finite JSON number")
    request = json.loads(payload.decode("utf-8"), object_pairs_hook=unique_object, parse_constant=invalid_constant)
    require(isinstance(request, dict) and set(request) == REQUEST_KEYS, "Invalid request fields")
    require(type(request["schemaVersion"]) is int and request["schemaVersion"] == version and request["source"] == "homebrew",
            "Unsupported request schema or source")
    uuid_value(request["requestId"])
    require(uuid_value(request["publisherSessionId"]) == uuid_value(manifest["publisherSessionId"]), "Request session differs from live host")
    metadata = manifest["metadata"]
    require(type(metadata["schemaVersion"]) is int and metadata["schemaVersion"] == version + 1
            and uuid_value(metadata["publisherSessionId"]) == uuid_value(manifest["publisherSessionId"])
            and revision(metadata["checkRevision"]) == revision(metadata["completedCheckRevision"])
            and metadata["checkRevision"] > 0, "Host snapshot is not ready")
    if version == 1:
        # Historical TestHost schema 2 remains isolated from the new schema 3 policy.
        require(metadata["checkPhase"] == "ready"
                and revision(metadata["inventoryRevision"]) == revision(metadata["checkedInventoryRevision"]),
                "Historical host snapshot is not ready")
    else:
        require((metadata["checkPhase"] == "ready" or
                 (metadata["checkPhase"] == "failed" and metadata.get("checkReason") == "sourceFailure"))
                and revision(metadata["inventoryRevision"]) == revision(metadata.get("completedInventoryRevision")),
                "Host full cohort has not completed")
    for key in ("inventoryRevision", "completedCheckRevision"):
        require(revision(request[key]) == revision(metadata[key]), "Request revision differs from live host")
    current_time = time.time() if now is None else now
    age = current_time - date_value(request["createdAt"])
    require(-30 <= age <= 120, "Request expired or is too far in the future")
    targets = request["targets"]
    require(isinstance(targets, list) and 1 <= len(targets) <= 16, "Invalid target count")
    identities = [target_identity(target, version) for target in targets]
    approved = [target_identity(target, version) for target in manifest["targets"]]
    require(all(approved.count(identity) == 1 for identity in identities), "Target differs from live host manifest")
    require(all(len({identity[index] for identity in identities}) == len(identities) for index in (0, 2, 3)),
            "Duplicate target identity")
    if version == 2:
        require(len({uuid_value(target["readinessEvidenceId"]) for target in targets}) == len(targets),
                "Duplicate request evidence")
        target_readiness(metadata, targets, current_time)
        for target, identity in zip(targets, identities):
            approved_target = manifest["targets"][approved.index(identity)]
            require(uuid_value(target["readinessEvidenceId"]) == uuid_value(approved_target["readinessEvidenceId"]),
                    "Target evidence differs from live host manifest")
    return request, url


def verify_manifest_pin(binding, expected_hash, required=False):
    if expected_hash is None:
        require(not required, "--manifest-sha256 is required for send")
        return
    require(re.fullmatch(r"[0-9a-f]{64}", expected_hash) is not None, "Invalid manifest SHA256")
    require(hashlib.sha256(binding.manifest_bytes).hexdigest() == expected_hash,
            "Live manifest differs from the prepared binding")


def forward(driver, args):
    manifest_hash = getattr(args, "manifest_sha256", None)
    if args.inspect:
        with driver.Binding(args.manifest) as binding:
            binding.check(alive=True)
            verify_manifest_pin(binding, manifest_hash)
            print(json.dumps({"manifestPath": binding.manifest_path, "manifest": binding.manifest,
                              "driverPath": args.driver, "driverSHA256": args.driver_sha256}, indent=2))
        return 0
    require(manifest_hash is not None, "--manifest-sha256 is required for send")
    require(args.url_file is not None and args.output_dir is not None, "--url-file and --output-dir are required for send")
    require(os.path.isabs(args.url_file) and os.path.realpath(args.url_file) == args.url_file,
            "URL file must have an absolute canonical path")

    def exact_request(binding, send_args):
        verify_manifest_pin(binding, manifest_hash, required=True)
        request, url = decode_exact_url(driver.read_absolute(args.url_file, maximum=MAX_URL), binding.manifest)
        send_args.scenario = "single" if len(request["targets"]) == 1 else "multiple"
        return request, url

    # Override only this in-memory imported module; preserve Binding, locking, identity rechecks and ACK capture.
    driver.request_for = exact_request
    args.scenario = "multiple"
    args.request = None
    args.conflict = False
    return driver.send(args)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--driver", required=True)
    parser.add_argument("--driver-sha256", required=True)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--manifest-sha256")
    parser.add_argument("--url-file")
    parser.add_argument("--output-dir")
    parser.add_argument("--inspect", action="store_true")
    args = parser.parse_args()
    require(sys.platform == "darwin", "Native host transport requires macOS")
    return forward(load_driver(args.driver, args.driver_sha256), args) or 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(json.dumps({"error": type(error).__name__, "message": str(error)}), file=sys.stderr)
        sys.exit(2)
