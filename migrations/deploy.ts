// Migrations are an early feature. Currently, they're nothing more than this
// temporary script, which can be used to deploy new programs.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const anchor = require('@coral-xyz/anchor')

module.exports = async (provider: any) => {
  anchor.setProvider(provider)
}
