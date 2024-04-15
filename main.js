const authRequest = async ({authorization_endpoint, code_challenge}) => {
  let response_type = 'code'
  let redirect_uri = 'http://localhost:8888/'
  let scope = 'openid webid 20offline_access'
  let client_id = 'https://solid-authentication.rdf.systems/webid'
  let code_challenge_method = 'S256'
  const query = new URLSearchParams({
    response_type,
    redirect_uri,
    scope,
    client_id,
    code_challenge_method,
    code_challenge
  })
  const url = new URL(`${authorization_endpoint}?${query}`)
  let r = await fetch(url)
  let text = await r.text()
  console.log(text)
}

// Code Challenge Shit
const sha256 = async (verifier) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const sha = crypto.subtle.digest('SHA-256', data)
  return sha
}

// yikes
const base64urlencode = (sha) => btoa(String.fromCharCode.apply(null, new Uint8Array(sha))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const getChallengeFromVerifier = async (verifier) => {
  const hash = await sha256(verifier)
  const base64encoded = base64urlencode(hash)
  return base64encoded
}

const createCodeChallenge = async () => {
  const verifier = crypto.randomUUID()
  const challenge = await getChallengeFromVerifier(verifier)
  return challenge
}
// End Code Chalelnge Shit

// Provider Shit
// could abstract into a single function:
const getAuthorizationEndpointFromWebID = async (webid) => {
  let authorization_endpoint = "…"
  return authorization_endpoint
}

// provider is a URL
const getProviderConfiguration = async (provider) => {
  let r = await fetch(`${provider}/.well-known/openid-configuration`)
  let json = await r.json()
  return json
}

// webID is a URL
const getProviderFromWebID = async (webID) => {
  let r = await fetch(webID, {
    headers: {
      "accept": "application/ld+json"
    }
  })
  let json = await r.json()
  let provider = json["http://www.w3.org/ns/solid/terms#oidcIssuer"]["@id"]
  return provider
}
// End Provider Shit

const auth_form = document.querySelector("form")
auth_form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const formData = new FormData(e.target)
  const webID = formData.get('webid')
  const provider = await getProviderFromWebID(webID)
  const config = await getProviderConfiguration(provider)
  const authorization_endpoint = config.authorization_endpoint
  const code_challenge = await createCodeChallenge()
  sessionStorage.setItem('code_challenge', code_challenge)
  await authRequest({
    authorization_endpoint,
    code_challenge
  })
})

const dialog = document.querySelector("dialog")
const openAuthDialog = () => {
  dialog.showModal()
}

const start_auth_button = document.querySelector('#start-auth')
start_auth_button.addEventListener('click', (e) => {
  e.preventDefault()
  openAuthDialog()
})

