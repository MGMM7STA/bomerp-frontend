export const environment = {
  formularioInscripcionUrl: '',
  apiBaseUrl: 'http://localhost:48088',
  keycloak: {
    issuer: 'http://localhost:48080/realms/saludable',
    clientId: 'saludable-frontend',
    redirectUri: 'http://localhost:4300/auth/callback',
    postLogoutRedirectUri: 'http://localhost:4300/',
  },
};