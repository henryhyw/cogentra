import { formatDistanceToNowStrict } from "date-fns";

export function fromNow(value: string) {
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
}

export function titleize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
