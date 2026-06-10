export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '投票统计' })
  : { navigationBarTitleText: '投票统计' }