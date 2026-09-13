const assert = require("node:assert/strict");
const test = require("node:test");
const { execFileSync } = require("node:child_process");
const { join, resolve } = require("node:path");
const { buildHomebrewReviewURL } = require(
  join(process.env.VESSLO_TEST_BUILD, "utils/handoff-contract.js"),
);
const transport = resolve("scripts/native-review/transport.py");
const now = Date.parse("2026-09-12T00:00:30Z");
function fixture() {
  const target = {
    appId: "22222222-2222-2222-2222-222222222222",
    bundleId: "invalid.vesslo.nativefixture.alpha",
    canonicalPath: "/VessloSynthetic/Alpha.app",
    caskToken: "vesslo-fixture-alpha",
    installedVersion: "1.0.0",
    expectedTargetVersion: "2.0.0",
  };
  const request = {
    schemaVersion: 1,
    requestId: "44444444-4444-4444-4444-444444444444",
    publisherSessionId: "11111111-1111-1111-1111-111111111111",
    createdAt: "2026-09-12T00:00:00.000Z",
    inventoryRevision: 1,
    completedCheckRevision: 1,
    source: "homebrew",
    targets: [target],
  };
  const manifest = {
    publisherSessionId: request.publisherSessionId,
    targets: [target],
    metadata: {
      schemaVersion: 2,
      publisherSessionId: request.publisherSessionId,
      checkPhase: "ready",
      inventoryRevision: 1,
      checkedInventoryRevision: 1,
      checkRevision: 1,
      completedCheckRevision: 1,
    },
  };
  return { request, manifest };
}
const pythonBase = `import importlib.util,json,sys\nspec=importlib.util.spec_from_file_location("transport_under_test",sys.argv[1])\nm=importlib.util.module_from_spec(spec)\nspec.loader.exec_module(m)\np=json.load(sys.stdin)\n`;
function runPython(code, payload = {}) {
  return JSON.parse(
    execFileSync("python3", ["-B", "-c", pythonBase + code, transport], {
      input: JSON.stringify(payload),
      encoding: "utf8",
    }),
  );
}
function decode(url, manifest) {
  return runPython(
    `try:\n request,url=m.decode_exact_url(p["url"].encode(),p["manifest"],p["now"])\n print(json.dumps({"ok":True,"request":request,"url":url}))\nexcept Exception as e:\n print(json.dumps({"ok":False,"error":str(e)}))`,
    { url, manifest, now: now / 1000 },
  );
}
function arbitraryURL(request) {
  return (
    `vesslo://review-homebrew/v${request.schemaVersion}?payload=` +
    Buffer.from(JSON.stringify(request)).toString("base64url")
  );
}

function readinessFixture() {
  const { request, manifest } = fixture();
  request.schemaVersion = 2;
  request.targets = request.targets.map((target) => ({
    ...target,
    readinessEvidenceId: "55555555-5555-5555-5555-555555555555",
  }));
  manifest.metadata = {
    ...manifest.metadata,
    schemaVersion: 3,
    completedInventoryRevision: 1,
    lastUpdateCheckAt: "2026-09-12T00:00:00.000Z",
    homebrewReadiness: [
      {
        target: structuredClone(manifest.targets[0]),
        source: "homebrew",
        state: "ready",
        evidenceId: request.targets[0].readinessEvidenceId,
        publisherSessionId: request.publisherSessionId,
        checkRevision: 1,
        inventoryRevision: 1,
        checkedAt: "2026-09-12T00:00:00.000Z",
        expiresAt: "2026-09-12T00:15:00.000Z",
      },
    ],
  };
  manifest.targets = structuredClone(request.targets);
  return { request, manifest };
}

test("native V2 transport preserves exact sender bytes with ready target proof despite an unrelated source failure", () => {
  const { request, manifest } = readinessFixture();
  manifest.metadata.checkPhase = "failed";
  manifest.metadata.checkReason = "sourceFailure";
  delete manifest.metadata.checkedInventoryRevision;
  const url = buildHomebrewReviewURL(request);
  assert.match(url, /^vesslo:\/\/review-homebrew\/v2\?payload=/);
  assert.deepEqual(decode(url, manifest), { ok: true, request, url });
  const formatted =
    "vesslo://review-homebrew/v2?payload=" +
    Buffer.from(JSON.stringify(request, null, 2) + "\n").toString("base64url");
  assert.equal(decode(formatted, manifest).url, formatted);
});

test("native V2 transport fails closed for incomplete cohort, missing, stale, altered or failed target evidence", () => {
  const changes = [
    (m) => {
      m.metadata.checkPhase = "checking";
    },
    (m) => {
      m.metadata.checkPhase = "failed";
      m.metadata.checkReason = "checkFailed";
    },
    (m) => {
      delete m.metadata.completedInventoryRevision;
    },
    (m) => {
      m.metadata.completedInventoryRevision++;
    },
    (m) => {
      m.metadata.completedCheckRevision++;
    },
    (m) => {
      delete m.metadata.homebrewReadiness;
    },
    (m) => {
      m.metadata.homebrewReadiness = [];
    },
    (m) => {
      m.metadata.homebrewReadiness[0].evidenceId =
        "66666666-6666-6666-6666-666666666666";
    },
    (m) => {
      m.metadata.homebrewReadiness[0].target.expectedTargetVersion = "3.0.0";
    },
    (m) => {
      m.metadata.homebrewReadiness[0].publisherSessionId =
        "66666666-6666-6666-6666-666666666666";
    },
    (m) => {
      m.metadata.homebrewReadiness[0].inventoryRevision++;
    },
    (m) => {
      m.metadata.homebrewReadiness[0].checkRevision++;
    },
    (m) => {
      m.metadata.homebrewReadiness[0].expiresAt = "2026-09-12T00:00:30.000Z";
    },
    (m) => {
      m.metadata.homebrewReadiness[0].expiresAt = "2026-09-12T00:15:00.001Z";
    },
    (m) => {
      m.metadata.homebrewReadiness[0].checkedAt = "2026-09-12T00:00:30.001Z";
    },
    (m) => {
      m.metadata.homebrewReadiness[0].checkedAt = "2026-02-30T00:00:00Z";
    },
    (m) => {
      m.metadata.homebrewReadiness[0].source = "sparkle";
    },
    (m) => {
      m.metadata.homebrewReadiness[0].state = "future";
    },
    (m) => {
      m.metadata.homebrewReadiness[0].reason = "sourceFailed";
    },
    (m) => {
      m.metadata.homebrewReadiness[0].target.readinessEvidenceId =
        "66666666-6666-6666-6666-666666666666";
    },
    (m) => {
      m.metadata.homebrewReadiness.push(
        structuredClone(m.metadata.homebrewReadiness[0]),
      );
    },
    (m) => {
      m.metadata.homebrewReadiness = Array.from(
        { length: 10001 },
        () => m.metadata.homebrewReadiness[0],
      );
    },
    (m) => {
      const proof = m.metadata.homebrewReadiness[0];
      proof.state = "failed";
      proof.reason = "sourceFailed";
      delete proof.evidenceId;
      delete proof.checkedAt;
      delete proof.expiresAt;
    },
  ];
  for (const change of changes) {
    const { request, manifest } = readinessFixture();
    change(manifest);
    assert.equal(
      decode(arbitraryURL(request), manifest).ok,
      false,
      change.toString(),
    );
  }
});

test("native V2 cannot fall back to a V1 request or use missing, duplicated or forged evidence IDs", () => {
  const { request, manifest } = readinessFixture();
  assert.equal(decode(arbitraryURL(fixture().request), manifest).ok, false);
  assert.equal(decode(arbitraryURL(request), fixture().manifest).ok, false);
  for (const change of [
    (r) => {
      delete r.targets[0].readinessEvidenceId;
    },
    (r) => {
      r.targets[0].readinessEvidenceId = null;
    },
    (r) => {
      r.targets[0].readinessEvidenceId = "invalid";
    },
    (r) => {
      r.targets[0].readinessEvidenceId = "66666666-6666-6666-6666-666666666666";
    },
    (r) => {
      r.targets.push(structuredClone(r.targets[0]));
    },
  ]) {
    const changed = structuredClone(request);
    change(changed);
    assert.equal(decode(arbitraryURL(changed), manifest).ok, false);
  }
  assert.equal(
    decode(arbitraryURL(request).replace("/v2?", "/v1?"), manifest).ok,
    false,
  );
});

test("native V2 accepts nullable absent fields without allowing an unrelated unavailable target to authorize selection", () => {
  const { request, manifest } = readinessFixture();
  manifest.metadata.homebrewReadiness[0].reason = null;
  const unavailable = {
    ...structuredClone(manifest.metadata.homebrewReadiness[0]),
    target: {
      ...manifest.metadata.homebrewReadiness[0].target,
      appId: "77777777-7777-7777-7777-777777777777",
      canonicalPath: "/VessloSynthetic/Beta.app",
      bundleId: "invalid.vesslo.nativefixture.beta",
      caskToken: "vesslo-fixture-beta",
    },
    state: "unverified",
    reason: "sourceUnverified",
    evidenceId: null,
    checkedAt: null,
    expiresAt: null,
  };
  manifest.metadata.homebrewReadiness.push(unavailable);
  assert.equal(decode(arbitraryURL(request), manifest).ok, true);
  unavailable.evidenceId = request.targets[0].readinessEvidenceId;
  assert.equal(decode(arbitraryURL(request), manifest).ok, false);
});

test("native transport preserves the actual TypeScript sender URL byte for byte", () => {
  const { request, manifest } = fixture();
  const url = buildHomebrewReviewURL(request);
  const result = decode(url, manifest);
  assert.equal(result.ok, true);
  assert.equal(result.url, url);
  assert.deepEqual(result.request, request);
  const formatted =
    "vesslo://review-homebrew/v1?payload=" +
    Buffer.from(JSON.stringify(request, null, 2) + "\n").toString("base64url");
  assert.equal(
    decode(formatted, manifest).url,
    formatted,
    "Even JSON formatting inside a canonical payload must remain unchanged",
  );
});

test("native transport rejects altered identity, session, revision, age and non-Homebrew requests", () => {
  const changes = [
    (r) => {
      r.targets[0].expectedTargetVersion = "9.0";
    },
    (r) => {
      r.targets[0].bundleId = "invalid.vesslo.nativefixture.beta";
    },
    (r) => {
      r.targets[0].canonicalPath = "/Applications/Real.app";
    },
    (r) => {
      r.targets[0].caskToken = "real-app";
    },
    (r) => {
      r.publisherSessionId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    },
    (r) => {
      r.inventoryRevision++;
    },
    (r) => {
      r.completedCheckRevision++;
    },
    (r) => {
      r.createdAt = "2026-09-11T23:58:29Z";
    },
    (r) => {
      r.createdAt = "2026-09-12T00:01:01Z";
    },
    (r) => {
      r.source = "sparkle";
    },
    (r) => {
      r.targets.push(structuredClone(r.targets[0]));
    },
    (r) => {
      r.inventoryRevision = Number.MAX_SAFE_INTEGER + 1;
    },
    (r) => {
      r.createdAt = "2026-02-30T00:00:00Z";
    },
    (r) => {
      r.targets[0].unexpected = true;
    },
  ];
  for (const change of changes) {
    const { request, manifest } = fixture();
    // Keep the source manifest immutable while attempting a forged request.
    const changed = structuredClone(request);
    change(changed);
    assert.equal(
      decode(arbitraryURL(changed), manifest).ok,
      false,
      JSON.stringify(changed),
    );
  }
});

test("native transport validates canonical URL shape, limits, duplicate keys and unknown fields", () => {
  const { request, manifest } = fixture();
  const url = buildHomebrewReviewURL(request);
  for (const bad of [
    url + "\n",
    url + "=",
    url + "&extra=1",
    url.replace("/v1?", "/v2?"),
    url.replace("vesslo:", "https:"),
    url + "#fragment",
    "x".repeat(32769),
  ]) {
    assert.equal(decode(bad, manifest).ok, false);
  }
  const duplicate = JSON.stringify(request).replace(
    '"source":"homebrew"',
    '"source":"homebrew","source":"homebrew"',
  );
  assert.equal(
    decode(
      "vesslo://review-homebrew/v1?payload=" +
        Buffer.from(duplicate).toString("base64url"),
      manifest,
    ).ok,
    false,
  );
  const extra = { ...request, extra: true };
  assert.equal(decode(arbitraryURL(extra), manifest).ok, false);
  const notReady = structuredClone(manifest);
  notReady.metadata.checkPhase = "checking";
  assert.equal(decode(url, notReady).ok, false);
});

test("verified driver loading checks hash before executing source and uses its verified bytes", () => {
  const result = runPython(
    `import tempfile,os,hashlib\nwith tempfile.TemporaryDirectory() as root:\n path=os.path.realpath(root)+"/driver.py"\n source=b"SYNTHETIC_DRIVER_ONLY = 1\\n"\n with open(path,"wb") as out: out.write(source)\n os.chmod(path,0o600)\n m.DRIVER_PATH=path\n try:\n  m.load_driver(path,"0"*64)\n  rejected=False\n except m.TransportError:\n  rejected=True\n driver=m.load_driver(path,hashlib.sha256(source).hexdigest())\n print(json.dumps({"rejected":rejected,"loaded":driver.SYNTHETIC_DRIVER_ONLY}))`,
  );
  assert.deepEqual(result, { rejected: true, loaded: 1 });
});

test("forward uses the existing driver send path and returns its receipt result without opening a URL", () => {
  const { request, manifest } = fixture();
  const url = buildHomebrewReviewURL(request);
  const result = runPython(
    `from types import SimpleNamespace\nm.time.time=lambda:p["now"]\nseen={}\nclass Driver:\n def read_absolute(self,path,maximum):\n  seen["readPath"]=path\n  seen["maximum"]=maximum\n  return p["url"].encode()\n def send(self,args):\n  request,url=self.request_for(SimpleNamespace(manifest=p["manifest"],manifest_bytes=b"fixture manifest"),args)\n  seen.update(url=url,request=request,scenario=args.scenario)\n  return 2\nargs=SimpleNamespace(inspect=False,url_file="/private/url-fixture.txt",output_dir="/private/output-fixture",manifest="/private/live/State/manifest.json",manifest_sha256=m.hashlib.sha256(b"fixture manifest").hexdigest())\n# Path identity is injected only for this unit boundary; no host or actual file is opened.\nm.os.path.realpath=lambda path:path\nresult=m.forward(Driver(),args)\nprint(json.dumps({"result":result,"seen":seen}))`,
    { url, manifest, now: now / 1000 },
  );
  assert.equal(
    result.result,
    2,
    "A receipt read failure must propagate unchanged",
  );
  assert.equal(result.seen.url, url);
  assert.equal(result.seen.scenario, "single");
  assert.deepEqual(result.seen.request, request);
});

test("inspect reuses live Binding checks and returns the complete bound manifest", () => {
  const { manifest } = fixture();
  const result = runPython(
    `from types import SimpleNamespace\nclass Binding:\n def __init__(self,path): self.manifest_path=path; self.manifest=p["manifest"]\n def __enter__(self): return self\n def __exit__(self,*args): pass\n def check(self,alive=None):\n  assert alive is True\n  self.manifest["liveCheckObserved"]=True\ndriver=SimpleNamespace(Binding=Binding)\nargs=SimpleNamespace(inspect=True,manifest="/private/live/State/manifest.json",driver=m.DRIVER_PATH,driver_sha256="a"*64)\nm.forward(driver,args)`,
    { manifest },
  );
  assert.equal(result.manifest.liveCheckObserved, true);
  assert.equal(result.manifestPath, "/private/live/State/manifest.json");
  assert.equal(result.driverSHA256, "a".repeat(64));
});

test("runtime manifest pin rejects replacement and is mandatory before a send", () => {
  const result = runPython(`from types import SimpleNamespace
binding=SimpleNamespace(manifest_bytes=b"original prepared manifest")
checks=[]
for value,required in [(None,True),("0"*64,True),(m.hashlib.sha256(binding.manifest_bytes).hexdigest(),True),(None,False)]:
 try:
  m.verify_manifest_pin(binding,value,required)
  checks.append(True)
 except m.TransportError:
  checks.append(False)
print(json.dumps(checks))`);
  assert.deepEqual(result, [false, false, true, true]);
});
