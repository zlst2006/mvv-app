export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '浏览 MVV' })
  : { navigationBarTitleText: '浏览 MVV' }