import { useEffect } from "react";
import { useWebHaptics } from "web-haptics/react";

const HAPTIC_PRESETS = new Set([
  "success",
  "warning",
  "error",
  "light",
  "medium",
  "heavy",
  "soft",
  "rigid",
  "selection",
  "nudge",
  "buzz",
]);

const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "summary",
  "[role='button']",
  "[role='tab']",
  "[role='menuitem']",
  "[data-haptic]",
].join(",");

const SELECTION_SELECTOR = [
  "select",
  "input[type='checkbox']",
  "input[type='radio']",
  "input[type='range']",
].join(",");

const WARNING_WORDS = /\b(delete|remove|logout|reject|decline|report|block|discard)\b/i;
const PRIMARY_WORDS = /\b(save|send|submit|confirm|accept|create|add|sign in|sign up|reset|request|complete|publish|continue|get started)\b/i;

const isDisabled = (element) =>
  element.matches(":disabled") ||
  element.getAttribute("aria-disabled") === "true" ||
  element.closest("[aria-disabled='true']");

const explicitPreset = (element) => {
  const owner = element.closest("[data-haptic]");
  const value = owner?.dataset.haptic;
  if (value === "none") return null;
  return HAPTIC_PRESETS.has(value) ? value : undefined;
};

const interactionPreset = (element) => {
  const explicit = explicitPreset(element);
  if (explicit !== undefined) return explicit;

  const description = [
    element.textContent,
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.className,
  ].filter((value) => typeof value === "string").join(" ");

  if (WARNING_WORDS.test(description)) return "warning";
  if (element.matches("[type='submit']") || PRIMARY_WORDS.test(description)) return "medium";
  if (element.matches("a[href], [role='tab'], [role='menuitem'], summary")) return "selection";
  return "light";
};

const toastPreset = (toast) => {
  if (toast.matches(".Toastify__toast--success")) return "success";
  if (toast.matches(".Toastify__toast--error")) return "error";
  if (toast.matches(".Toastify__toast--warning")) return "warning";
  return "soft";
};

export const requestAppHaptic = (preset = "medium") => {
  window.dispatchEvent(new CustomEvent("app:haptic", { detail: preset }));
};

export default function ApplicationHaptics() {
  const { trigger, cancel } = useWebHaptics();

  useEffect(() => {
    const play = (preset) => {
      if (!HAPTIC_PRESETS.has(preset)) return;
      void trigger(preset);
    };

    const handleClick = (event) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest(INTERACTIVE_SELECTOR);
      if (!element || isDisabled(element)) return;
      const preset = interactionPreset(element);
      if (preset) play(preset);
    };

    const handleChange = (event) => {
      if (!(event.target instanceof Element) || !event.target.matches(SELECTION_SELECTOR)) return;
      if (isDisabled(event.target) || explicitPreset(event.target) === null) return;
      play(explicitPreset(event.target) || "selection");
    };

    const handleRequestedHaptic = (event) => play(event.detail || "medium");
    const observedToasts = new WeakSet();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          const toasts = [
            ...(node.matches(".Toastify__toast") ? [node] : []),
            ...node.querySelectorAll(".Toastify__toast"),
          ];
          toasts.forEach((toast) => {
            if (observedToasts.has(toast)) return;
            observedToasts.add(toast);
            play(toastPreset(toast));
          });
        });
      });
    });

    document.addEventListener("click", handleClick, true);
    document.addEventListener("change", handleChange, true);
    window.addEventListener("app:haptic", handleRequestedHaptic);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("change", handleChange, true);
      window.removeEventListener("app:haptic", handleRequestedHaptic);
      observer.disconnect();
      cancel();
    };
  }, [cancel, trigger]);

  return null;
}
