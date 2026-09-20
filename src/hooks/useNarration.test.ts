import { describe, expect, it, beforeEach } from "vitest";
import { getNarrationEngine } from "../hooks/useNarration";

describe("useNarration engine", () => {
  beforeEach(() => {
    getNarrationEngine().stop();
  });

  it("exposes pause resume stop without crashing when speech is missing", () => {
    const engine = getNarrationEngine();
    engine.setEnabled(true);
    engine.speakSequence([{ text: "A song was played." }, { text: "A visit was recorded." }]);
    expect(engine.isSpeaking || !engine.supported).toBe(true);
    engine.pause();
    engine.resume();
    engine.stop();
    expect(engine.isSpeaking).toBe(false);
    expect(engine.isPaused).toBe(false);
  });

  it("does not autoplay; speak must be called", () => {
    const engine = getNarrationEngine();
    expect(engine.isSpeaking).toBe(false);
  });
});

describe("speech unsupported message", () => {
  it("supported flag is a boolean", () => {
    expect(typeof getNarrationEngine().supported).toBe("boolean");
  });
});
