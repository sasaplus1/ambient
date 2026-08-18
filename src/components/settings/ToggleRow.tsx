type ToggleRowProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      class="setting-row"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span class="setting-row__label">{label}</span>
      <span class="setting-row__switch" data-checked={checked}>
        <span class="setting-row__knob" />
      </span>
    </button>
  );
}
