interface Props {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (val: number) => void;
}

export default function StarRating({ rating, max = 5, size = 16, interactive, onChange }: Props) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{
            fontSize: size,
            color: i < rating ? "#f5a623" : "#ccc",
            cursor: interactive ? "pointer" : "default",
          }}
          onClick={() => interactive && onChange?.(i + 1)}
        >
          ★
        </span>
      ))}
    </span>
  );
}
