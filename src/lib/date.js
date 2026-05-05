const postDateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

export function formatPostDate(value) {
  if (!value) return "";
  return postDateFormatter.format(new Date(value));
}
