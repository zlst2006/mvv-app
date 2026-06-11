export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '智联数通讨论区' })
  : { navigationBarTitleText: '智联数通讨论区' }