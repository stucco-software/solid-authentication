import { createDPoP } from './dpop.js'

const authRequest = async ({authorization_endpoint, code_challenge}) => {
  let response_type = 'code'
  let redirect_uri = 'https://solid-authentication.rdf.systems/'
  let scope = 'openid webid offline_access'
  let client_id = 'https://solid-authentication.rdf.systems/webid.json'
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
  window.location = url
}

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
  const code_verifier = crypto.randomUUID()
  const code_challenge = await getChallengeFromVerifier(code_verifier)
  return {
    code_challenge,
    code_verifier
  }
}

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

export const authenticate = async (webID) => {
  const provider = await getProviderFromWebID(webID)
  const config = await getProviderConfiguration(provider)
  const authorization_endpoint = config.authorization_endpoint
  const {code_challenge, code_verifier} = await createCodeChallenge()
  sessionStorage.setItem('code_verifier', code_verifier)
  await authRequest({
    authorization_endpoint,
    code_challenge
  })
}

export const callback = async (cb) => {
  const searchParams = new URLSearchParams(window.location.search)
  const code = searchParams.get('code')
  const iss = searchParams.get('iss')
  if (code && iss) {
    await createDPoP({code, iss})
  }
  const access_token = sessionStorage.getItem('access_token')
  if (access_token && access_token !== 'undefined') {
    cb()
  }
}