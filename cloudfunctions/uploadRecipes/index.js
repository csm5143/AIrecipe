const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

/**
 * 云函数入口：批量导入菜谱数据
 * 导入 miniprogram/data/recipes-cloud.json 中的数据
 */
exports.main = async (event, context) => {
  try {
    // 判断是上传 recipes 还是 ingredients
    const collectionName = event.collection || 'recipes';
    
    // 获取要导入的数据
    let recipesToUpload = [];
    
    // 方式1: 直接从云存储或通过 URL 获取 JSON 数据
    if (event.data) {
      recipesToUpload = event.data;
    }
    // 方式2: 从本地文件读取（需要通过云存储）
    else if (event.cloudFilePath) {
      const fileContent = await cloud.downloadFile({
        fileID: event.cloudFilePath
      });
      recipesToUpload = JSON.parse(fileContent.fileContent);
    }

    if (!recipesToUpload || recipesToUpload.length === 0) {
      return {
        success: false,
        message: '没有数据可导入'
      };
    }

    console.log(`开始导入 ${recipesToUpload.length} 条数据到 ${collectionName} 集合...`);
    
    const batchSize = 20; // 云数据库每次最多写入20条
    let successCount = 0;
    let failCount = 0;
    const failReasons = [];
    
    for (let i = 0; i < recipesToUpload.length; i += batchSize) {
      const batch = recipesToUpload.slice(i, i + batchSize);
      
      // 批量插入
      const tasks = batch.map(item => {
        // 确保数据格式正确，移除 _id 等字段（如果有）
        const data = { ...item };
        delete data._id;
        delete data._openid;
        
        return db.collection(collectionName).add({
          data: data
        }).catch(err => {
          failCount++;
          failReasons.push({
            name: item.name || item.title || `index-${i}`,
            error: err.message || '未知错误'
          });
          return null;
        });
      });
      
      const results = await Promise.all(tasks);
      
      // 统计成功数量
      results.forEach((res, idx) => {
        if (res && res._id) {
          successCount++;
        }
      });
      
      console.log(`已导入 ${Math.min(i + batchSize, recipesToUpload.length)}/${recipesToUpload.length} 条`);
      
      // 适当延时，避免频率限制
      if (i + batchSize < recipesToUpload.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      success: true,
      message: `导入完成`,
      total: recipesToUpload.length,
      successCount,
      failCount,
      failReasons: failCount > 0 ? failReasons : undefined
    };
    
  } catch (error) {
    console.error('导入失败:', error);
    return {
      success: false,
      message: '导入过程出错',
      error: error.message || String(error)
    };
  }
};