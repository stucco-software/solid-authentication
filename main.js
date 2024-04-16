import { authenticate, callback } from './auth.js'

const auth_form = document.querySelector("form")
auth_form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const formData = new FormData(e.target)
  const webID = formData.get('webid')
  await authenticate(webID)
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

const handleAuthState = () => {
  const mark = document.querySelector('mark')
  start_auth_button.remove()
  dialog.remove()
  const access_token = sessionStorage.getItem('access_token')
  mark.innerHTML = 'authenticated'
  console.log(access_token)
}

callback(handleAuthState)