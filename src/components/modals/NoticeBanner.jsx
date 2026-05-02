export function NoticeBanner({ notice }) {
  if (!notice) {
    return null
  }

  return <p className="notice-banner">{notice}</p>
}
