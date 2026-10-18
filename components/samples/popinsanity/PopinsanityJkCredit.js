/** JK wordmark for Popinsanity only — static markup (no router/window) to avoid hydration drift. */
const LOGO_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;1,9..40,400&family=Playfair+Display:wght@700&display=swap');
.sample-jk-credit{padding:8px 16px 2px;font-family:'DM Sans',system-ui,sans-serif;line-height:1}
.sample-jk-credit a{display:inline-flex;align-items:center;text-decoration:none}
.sample-jk-credit .m-logo__jk{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#2B2018;line-height:1}
.sample-jk-credit .m-logo__dot{color:#C9A84C}
@media(min-width:861px){.sample-jk-credit{padding:8px 30px 2px}}
`

export default function PopinsanityJkCredit() {
  return (
    <>
      <style>{LOGO_CSS}</style>
      <div className="sample-jk-credit">
        <a href="https://jknojokes.com" aria-label="JK No Jokes home">
          <span className="m-logo__jk">
            JK<span className="m-logo__dot">.</span>
          </span>
        </a>
      </div>
    </>
  )
}
