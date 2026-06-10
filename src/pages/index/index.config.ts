export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '撰写 MVV' })
  : { navigationBarTitleText: '撰写 MVV' }