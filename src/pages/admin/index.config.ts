export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '管理员设置' })
  : { navigationBarTitleText: '管理员设置' }