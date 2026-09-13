import { VessloDataState } from "./data-state";
import { getFixtureSnapshot } from "../../fixture/scenarios";

export class VessloDataReader {
  private disposed = false;
  private state = getFixtureSnapshot();

  async read(_options?: { force?: boolean }): Promise<VessloDataState> {
    if (!this.disposed) this.state = getFixtureSnapshot();
    return this.state;
  }

  dispose() {
    this.disposed = true;
  }
}
