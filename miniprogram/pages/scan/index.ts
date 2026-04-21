// scan/index.ts
import { recognizeImage, IngredientRecognitionResult } from '../../utils/ingredientRecognize'
import { loadIngredientsJson } from '../../utils/dataLoader'
import { getFallbackIngredients } from '../../utils/fallbackIngredients'
import { isFormalUser, checkScanAccess, consumeScanCountIfNeeded, getDisplayRemainingCount } from '../../utils/userAuth'

Component({
  data: {
    imageUrls: [] as string[],
    recognizing: false,
    recognizingIndex: 0,
    recognizedIngredients: [] as IngredientRecognitionResult[],
    selectedIngredients: [] as string[],
    showResult: false,
    canGenerate: false,
    showAddPanel: false,
    addInputValue: '',
    suggestions: [] as string[],
    // 名称映射面板
    showMappingPanel: false,
    mappingSource: '',
    mappingCandidates: [] as { name: string; category: string }[],
    // 待处理队列
    pendingMapping: [] as string[],
    // 剩余拍照次数
    remainingCount: 3,
    // 图片模糊提示
    showBlurTip: false,
  },

  lifetimes: {
    attached() {
      this.updateRemainingCount();
    }
  },

  pageLifetimes: {
    show() {
      this.updateRemainingCount();
    }
  },

  methods: {
    // 更新剩余次数显示（仅游客/未登录显示）
    updateRemainingCount() {
      const count = getDisplayRemainingCount();
      this.setData({ remainingCount: count });
    },

    // 从相册选择多张图片（一次选完）
    onChooseImages() {
      const { canUse } = checkScanAccess();
      if (!canUse) {
        wx.showModal({
          title: '提示',
          content: '今日次数已用尽，请明天再来~',
          showCancel: false,
          confirmText: '我知道了'
        });
        return;
      }

      wx.chooseMedia({
        count: 9,  // 最多选择9张图片
        mediaType: ['image'],
        sourceType: ['album'],
        success: (res) => {
          const tempFilePaths = res.tempFiles.map(f => f.tempFilePath)
          if (tempFilePaths.length === 0) return

          this.setData({
            imageUrls: tempFilePaths,
            recognizedIngredients: [],
            selectedIngredients: [],
            showResult: false,
            canGenerate: false,
          })

          this.handleImageRecognition(tempFilePaths)
        },
        fail: (err) => {
          if (err.errMsg.indexOf('cancel') === -1) {
            wx.showToast({ title: '选择图片失败', icon: 'none' })
          }
        }
      })
    },

    // 拍照（单张）
    onTakePhoto() {
      const { canUse } = checkScanAccess();
      if (!canUse) {
        wx.showModal({
          title: '提示',
          content: '今日次数已用尽，请明天再来~',
          showCancel: false,
          confirmText: '我知道了'
        });
        return;
      }

      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera'],
        camera: 'back',
        sizeType: ['compressed'],
        success: (res) => {
          const tempFilePath = res.tempFiles[0].tempFilePath
          this.setData({
            imageUrls: [tempFilePath],
            recognizedIngredients: [],
            selectedIngredients: [],
            showResult: false,
            canGenerate: false,
          })
          this.handleImageRecognition([tempFilePath])
        },
        fail: (err) => {
          if (err.errMsg.indexOf('cancel') === -1) {
            wx.showToast({ title: '拍照失败', icon: 'none' })
          }
        }
      })
    },

    // 重新拍摄
    onRetake() {
      this.setData({
        imageUrls: [],
        recognizing: false,
        recognizingIndex: 0,
        recognizedIngredients: [],
        selectedIngredients: [],
        showResult: false,
        canGenerate: false,
        showAddPanel: false,
        addInputValue: '',
        suggestions: [],
        showBlurTip: false,
      })
    },

    // 预览单张图片
    onPreviewSingleImage(e: WechatMiniprogram.BaseEvent) {
      const index = e.currentTarget.dataset.index as number
      wx.previewImage({
        current: this.data.imageUrls[index],
        urls: this.data.imageUrls,
      })
    },

    // 移除单张图片
    onRemoveImage(e: WechatMiniprogram.BaseEvent) {
      const index = e.currentTarget.dataset.index as number
      const urls = this.data.imageUrls.slice()
      urls.splice(index, 1)

      // 同时移除该图片识别出的食材
      const results = this.data.recognizedIngredients.slice()
      results.splice(index, 1)

      // 更新选中食材
      const allNames = this.data.selectedIngredients.filter((name: string) => {
        return results.some((r: IngredientRecognitionResult) => r.name === name)
      })

      this.setData({
        imageUrls: urls,
        recognizedIngredients: results,
        selectedIngredients: allNames,
        canGenerate: allNames.length > 0,
        showResult: urls.length > 0,
      })
    },

    // 切换食材选中状态（识别列表中的）
    onToggleIngredient(e: WechatMiniprogram.BaseEvent) {
      const name = e.currentTarget.dataset.name as string
      const current = this.data.selectedIngredients.slice()
      const idx = current.indexOf(name)

      if (idx > -1) {
        current.splice(idx, 1)
      } else {
        current.push(name)
      }

      this.setData({
        selectedIngredients: current,
        canGenerate: current.length > 0,
      })
    },

    // 移除食材
    onRemoveIngredient(e: WechatMiniprogram.BaseEvent) {
      const name = e.currentTarget.dataset.name as string
      const current = this.data.selectedIngredients.filter(function(item) {
        return item !== name
      })
      this.setData({
        selectedIngredients: current,
        canGenerate: current.length > 0,
      })
    },

    // 打开添加食材弹窗
    onOpenAddPanel() {
      this.setData({
        showAddPanel: true,
        addInputValue: '',
        suggestions: [],
      })
    },

    // 关闭添加食材弹窗
    onCloseAddPanel() {
      this.setData({
        showAddPanel: false,
        addInputValue: '',
        suggestions: [],
      })
    },

    // 搜索输入时，实时匹配建议
    onAddInput(e: any) {
      const input = (e.detail.value as string).trim()
      this.setData({ addInputValue: input })

      if (input.length === 0) {
        this.setData({ suggestions: [] })
        return
      }

      const allIngredients = this.getAllIngredientNames()
      const inputLower = input.toLowerCase()
      const matched = allIngredients.filter(function(name: string) {
        return name.toLowerCase().includes(inputLower)
      }).slice(0, 8)

      this.setData({ suggestions: matched })
    },

    // 确认添加（键盘回车）要添加一个添加按钮
    onConfirmAdd() {
      const input = this.data.addInputValue.trim()
      if (!input) return

      const matchedName = this.findBestMatch(input)
      if (!matchedName) {
        wx.showToast({ title: '未找到该食材，请尝试其他名称', icon: 'none', duration: 2000 })
        return
      }

      this.doAddIngredient(matchedName, input)
    },

    // 点击建议项添加
    onSelectSuggestion(e: WechatMiniprogram.BaseEvent) {
      const name = e.currentTarget.dataset.name as string
      this.doAddIngredient(name, name)
    },

    // 执行添加食材
    doAddIngredient(matchedName: string, inputValue: string) {
      const current = this.data.selectedIngredients.slice()

      if (current.indexOf(matchedName) > -1) {
        wx.showToast({
          title: '「' + matchedName + '」已添加',
          icon: 'none',
          duration: 1500
        })
        return
      }

      current.push(matchedName)
      this.setData({
        selectedIngredients: current,
        canGenerate: true,
        showAddPanel: false,
        addInputValue: '',
        suggestions: [],
      })

      if (matchedName !== inputValue) {
        wx.showToast({
          title: '已添加「' + matchedName + '」',
          icon: 'none',
          duration: 1500
        })
      }
    },

    // 获取所有食材库名称列表
    getAllIngredientNames(): string[] {
      try {
        const jsonData = loadIngredientsJson()
        if (jsonData && jsonData.length) {
          return jsonData.map(function(item: any) {
            return item.name || item.title || item.ingredient || ''
          }).filter(function(name: string) {
            return !!name
          })
        }
      } catch (e) {
        console.error('加载食材库失败', e)
      }
      return getFallbackIngredients().map(function(item: any) {
        return item.name
      })
    },

    // 获取所有食材数据（含 category）
    getAllIngredientData(): { name: string; category: string }[] {
      try {
        const jsonData = loadIngredientsJson()
        if (jsonData && jsonData.length) {
          return jsonData.map(function(item: any) {
            return { name: item.name || item.title || item.ingredient || '', category: item.category || '' }
          }).filter(function(item: any) {
            return !!item.name
          })
        }
      } catch (e) {
        console.error('加载食材库失败', e)
      }
      return []
    },

    // 查找最匹配的食材名称
    findBestMatch(inputName: string): string | null {
      const allIngredients = this.getAllIngredientNames()
      const input = inputName.trim().toLowerCase()

      // 精确匹配
      for (let i = 0; i < allIngredients.length; i++) {
        var name = allIngredients[i]
        if (name.toLowerCase() === input) {
          return name
        }
      }

      // 包含匹配
      for (var j = 0; j < allIngredients.length; j++) {
        var name2 = allIngredients[j]
        if (name2.toLowerCase().includes(input)) {
          return name2
        }
      }

      // 反向包含
      for (var k = 0; k < allIngredients.length; k++) {
        var name3 = allIngredients[k]
        if (input.includes(name3.toLowerCase())) {
          return name3
        }
      }

      // 模糊匹配
      for (var m = 0; m < allIngredients.length; m++) {
        var name4 = allIngredients[m]
        if (this.isFuzzyMatch(input, name4.toLowerCase())) {
          return name4
        }
      }

      return null
    },

    // 简单模糊匹配
    isFuzzyMatch(input: string, target: string): boolean {
      var aliasMap: Record<string, string[]> = {
        '猪肉': ['瘦肉', '肉', '猪肉片', '肉丝', '猪里脊'],
        '牛肉': ['牛里脊', '牛柳', '牛肉片', '牛肉丝'],
        '鸡肉': ['鸡胸', '鸡腿肉', '鸡胸肉'],
        '鸡蛋': ['蛋', '鸡蛋黄', '蛋白'],
        '番茄': ['西红柿', '番茄酱'],
        '土豆': ['马铃薯'],
        '白菜': ['大白菜'],
        '黄瓜': ['青瓜'],
        '胡萝卜': ['红萝卜'],
        '洋葱': ['葱头'],
        '大葱': ['葱', '小葱'],
        '蒜瓣': ['大蒜', '蒜'],
        '豆腐': ['嫩豆腐', '老豆腐'],
      }

      for (var key in aliasMap) {
        var aliases = aliasMap[key]
        for (var ai = 0; ai < aliases.length; ai++) {
          var alias = aliases[ai]
          if (input.includes(alias.toLowerCase()) || target.includes(alias.toLowerCase())) {
            if (target.includes(key.toLowerCase())) {
              return true
            }
          }
        }
      }

      var matchCount = 0
      for (var ci = 0; ci < input.length; ci++) {
        if (target.indexOf(input.charAt(ci)) > -1) {
          matchCount++
        }
      }

      if (input.length >= 2 && matchCount >= Math.ceil(input.length / 2)) {
        return true
      }

      return false
    },

    // 生成菜谱（拍照识别的食材只在当前会话有效，退出后不再显示对比）
    onGenerateRecipes() {
      if (!this.data.canGenerate) return

      // 设置会话标记（当前页面栈有效，退出后自动失效）
      const sessionId = 'scan_' + Date.now();
      wx.setStorageSync('scanSessionId', sessionId);
      wx.setStorageSync('scanIngredients', this.data.selectedIngredients);

      wx.navigateTo({
        url: '/pages/recipes/list?from=scan&sessionId=' + sessionId + '&ingredients=' + encodeURIComponent(JSON.stringify(this.data.selectedIngredients))
      })
    },

    // 并行识别多张图片
    async handleImageRecognition(imagePaths: string[]) {
      if (imagePaths.length === 0) return

      // 消耗一次拍照次数（仅游客需要消耗）
      if (!consumeScanCountIfNeeded()) {
        wx.showModal({
          title: '提示',
          content: '今日次数已用尽，请明天再来~',
          showCancel: false,
          confirmText: '我知道了'
        })
        return
      }

      this.setData({
        recognizing: true,
        recognizingIndex: 0,
        showResult: false,
      })

      wx.showLoading({ title: '正在识别...' })

      try {
        // 并行识别所有图片
        const promiseResults = await Promise.all(
          imagePaths.map((path, index) =>
            recognizeImage(path)
              .then(results => ({ index, results, success: true }))
              .catch(err => {
                console.error(`第${index + 1}张图片识别失败`, err)
                return { index, results: [], success: false }
              })
          )
        )

        // 合并所有结果并规范化名称
        const allResults: IngredientRecognitionResult[] = []
        const allSelected: string[] = []
        const pendingMapping: string[] = []

        for (const result of promiseResults) {
          for (const item of result.results) {
            if (item.confidence >= 0.3) {
              const normalizedName = this.normalizeIngredientName(item.name)
              if (normalizedName) {
                const exists = allResults.some(r => r.name === normalizedName)
                if (!exists) {
                  allResults.push({ ...item, name: normalizedName })
                  allSelected.push(normalizedName)
                }
              } else {
                // 不在食材库且无法映射，标记待处理
                const exists = allResults.some(r => r.name === item.name)
                if (!exists && !pendingMapping.includes(item.name)) {
                  pendingMapping.push(item.name)
                }
              }
            }
          }
        }

        wx.hideLoading()

        // 检测图片是否可能模糊（识别结果太少或置信度太低）
        const isLikelyBlurry = this.checkIfImageBlurry(allResults, promiseResults);

        this.setData({
          recognizing: false,
          recognizingIndex: 0,
          recognizedIngredients: allResults,
          selectedIngredients: allSelected,
          showResult: true,
          canGenerate: allSelected.length > 0,
          remainingCount: getDisplayRemainingCount(),
          showBlurTip: isLikelyBlurry,
        })

        // 有待映射的食材，弹出选择面板
        if (pendingMapping.length > 0) {
          this.processNextMapping(pendingMapping, allResults, allSelected)
        } else if (allResults.length === 0) {
          wx.showToast({
            title: '未识别到食材，请重试或手动添加',
            icon: 'none',
            duration: 3000
          })
        } else {
          wx.showToast({
            title: `识别到 ${allSelected.length} 种食材`,
            icon: 'none',
            duration: 2000
          })
        }
      } catch (error) {
        console.error('识别失败', error)
        wx.hideLoading()
        this.setData({ recognizing: false, recognizingIndex: 0 })
        wx.showToast({
          title: '识别失败，请重试',
          icon: 'none'
        })
      }
    },

    // 检测图片是否可能模糊
    // 判断逻辑：识别结果少于2种，或者平均置信度低于0.5
    checkIfImageBlurry(allResults: IngredientRecognitionResult[], promiseResults: { success: boolean; results: any[] }[]): boolean {
      // 如果没有任何成功的识别结果，图片可能有问题
      const successCount = promiseResults.filter(r => r.success).length;
      if (successCount === 0) return true;

      // 如果识别到的食材少于2种，图片可能模糊或拍摄角度不好
      if (allResults.length < 2) return true;

      // 计算平均置信度
      if (allResults.length > 0) {
        const avgConfidence = allResults.reduce((sum, r) => sum + r.confidence, 0) / allResults.length;
        // 平均置信度低于0.5，说明AI识别也不太确定
        if (avgConfidence < 0.5) return true;
      }

      return false;
    },

    // 关闭模糊提示
    onCloseBlurTip() {
      this.setData({ showBlurTip: false });
    },

    // 逐个处理待映射食材
    processNextMapping(pending: string[], doneResults: IngredientRecognitionResult[], doneSelected: string[]) {
      if (pending.length === 0) {
        // 所有映射处理完毕，显示结果界面
        this.setData({
          showMappingPanel: false,
          showResult: true,
          recognizedIngredients: doneResults,
          selectedIngredients: doneSelected,
          canGenerate: doneSelected.length > 0,
        });
        if (doneResults.length > 0) {
          wx.showToast({
            title: `识别到 ${doneSelected.length} 种食材`,
            icon: 'none',
            duration: 2000
          });
        }
        return;
      }

      const sourceName = pending[0];
      const candidates = this.findMappingCandidates(sourceName);

      if (candidates.length === 0) {
        // 找不到任何候选，自动跳过
        this.processNextMapping(pending.slice(1), doneResults, doneSelected);
        return;
      }

      this.setData({
        showMappingPanel: true,
        mappingSource: sourceName,
        mappingCandidates: candidates,
        pendingMapping: pending,
        recognizedIngredients: doneResults,
        selectedIngredients: doneSelected,
      });
    },

    // 规范化食材名称（直接映射）
    normalizeIngredientName(name: string): string | null {
      const allIngredients = this.getAllIngredientNames()
      const normalized = name.trim().toLowerCase()

      // 1. 精确匹配
      for (const ing of allIngredients) {
        if (ing.toLowerCase() === normalized) return ing
      }

      // 2. 别名映射（先执行，让"长茄子" → "茄子"，避免被"长茄子"占坑）
      const mapped = this.mapAliasToStandard(normalized)
      if (mapped) return mapped

      // 3. 包含匹配（较短名称优先，避免"长茄子"优先于"茄子"）
      let bestMatch: string | null = null
      let shortestLen = Infinity
      for (const ing of allIngredients) {
        const ingLower = ing.toLowerCase()
        // 食材名包含识别结果
        if (ingLower.includes(normalized)) {
          if (ingLower.length < shortestLen) {
            shortestLen = ingLower.length
            bestMatch = ing
          }
        }
        // 识别结果包含食材名
        if (normalized.includes(ingLower)) {
          if (ingLower.length < shortestLen) {
            shortestLen = ingLower.length
            bestMatch = ing
          }
        }
      }
      if (bestMatch) return bestMatch

      return null
    },

    // 别名 → 标准食材名称
    mapAliasToStandard(name: string): string | null {
      const aliasMap: Record<string, string[]> = {
        '猪肉': ['猪肉末', '肉末', '绞肉', '肉糜', '猪肉糜', '猪肉馅', '肉馅', '猪肉碎'],
        '牛肉': ['牛肉末', '牛肉糜', '牛肉馅', '牛肉碎', '牛绞肉'],
        '鸡肉': ['鸡胸肉末', '鸡肉糜', '鸡肉馅', '鸡胸末'],
        '虾仁': ['虾肉', '虾糜'],
        '鱼肉': ['鱼糜', '鱼馅', '鱼蓉'],
        '鸡蛋': ['蛋液', '全蛋', '鸡蛋液'],
        '番茄': ['西红柿', '番茄'],
        '土豆': ['马铃薯'],
        '黄瓜': ['青瓜'],
        '胡萝卜': ['红萝卜'],
        '大白菜': ['白菜'],
        '卷心菜': ['包菜', '甘蓝'],
        '豆腐': ['嫩豆腐', '老豆腐', '北豆腐', '南豆腐'],
        '蒜瓣': ['大蒜', '蒜', '蒜头'],
        '香菜': ['芫荽'],
        '辣椒': ['尖椒', '青椒', '红椒', '杭椒', '线椒'],
        '洋葱': ['葱头'],
        '葱': ['小葱', '香葱', '细葱', '细香葱'],
        // 茄子相关
        '茄子': ['长茄子', '圆茄子', '紫茄子'],
        // 四季豆相关
        '四季豆': ['豆角', '菜豆', '架豆'],
        // 西葫芦相关
        '西葫芦': ['角瓜', '番瓜', '小瓜'],
        // 南瓜相关
        '南瓜': ['倭瓜', '北瓜', '金瓜'],
        // 生菜相关
        '生菜': ['叶生菜', '散叶生菜', '球生菜'],
        // 莴笋相关
        '莴笋': ['莴苣', '千金菜'],
        // 白萝卜相关
        '白萝卜': ['萝卜', '水萝卜', '心灵美'],
        // 莲藕相关
        '莲藕': ['藕', '莲菜'],
        // 山药相关
        '山药': ['淮山', '怀山药', '土薯'],
        // 金针菇相关
        '金针菇': ['朴菇', '智力菇'],
        // 杏鲍菇相关
        '杏鲍菇': ['刺芹侧耳'],
        // 香菇相关
        '香菇': ['花菇', '冬菇', '香蕈'],
        // 口蘑相关
        '口蘑': ['白蘑菇', '圆蘑菇'],
        // 木耳相关
        '木耳': ['云耳', '黑木耳', '川耳'],
        // 银耳相关
        '银耳': ['白木耳', '雪耳'],
        // 腐竹相关
        '腐竹': ['豆皮', '腐皮', '豆筋'],
        // 糯米相关
        '糯米': ['江米', '紫糯米', '黑米'],
        // 小米相关
        '小米': ['粟米', '谷子'],
        // 黑米相关
        '黑米': ['黑糯米', '血糯米'],
        // 可乐相关
        '可乐': ['可口可乐', '百事可乐'],
        // 料酒相关
        '料酒': ['黄酒', '老酒', '花雕'],
        // 生抽相关
        '生抽': ['酱油', '淡酱油'],
        // 老抽相关
        '老抽': ['红烧酱油', '浓酱油'],
        // 蚝油相关
        '蚝油': ['牡蛎油'],
        // 芝麻油相关
        '芝麻油': ['香油', '麻油'],
        // 玉米油相关
        '玉米油': ['粟米油'],
        // 花生油相关
        '花生油': ['生油'],
        // 面粉相关
        '面粉': ['小麦粉', '中筋面粉', '低筋面粉', '高筋面粉'],
        // 淀粉相关
        '淀粉': ['生粉', '太白粉', '玉米淀粉', '土豆淀粉', '木薯淀粉'],
        // 白糖相关
        '白糖': ['白砂糖', '细砂糖', '糖粉'],
        // 冰糖相关
        '冰糖': ['冰片糖'],
        // 红糖相关
        '红糖': ['赤砂糖', '黑糖'],
      }

      for (const [standard, aliases] of Object.entries(aliasMap)) {
        for (const alias of aliases) {
          if (name.includes(alias.toLowerCase()) || alias.toLowerCase().includes(name)) {
            return standard
          }
        }
      }
      return null
    },

    // 查找候选映射食材
    findMappingCandidates(sourceName: string): { name: string; category: string }[] {
      const allIngredients = this.getAllIngredientData()
      const candidates: { name: string; category: string }[] = []

      // 提取关键词匹配候选
      const keywords = this.extractKeywords(sourceName)

      for (const ing of allIngredients) {
        const ingLower = ing.name.toLowerCase()
        for (const kw of keywords) {
          if (ingLower.includes(kw) || kw.includes(ingLower)) {
            candidates.push({ name: ing.name, category: ing.category || '' })
            break
          }
        }
      }

      return candidates.slice(0, 6)
    },

    // 提取关键词
    extractKeywords(name: string): string[] {
      const words: string[] = []
      const lower = name.toLowerCase()

      // 常见食材类型关键词
      const typeKeywords = ['肉', '鱼', '虾', '鸡', '牛', '猪', '羊', '蛋', '豆腐', '菜', '蔬', '椒', '菇', '葱', '蒜', '姜', '萝卜', '豆']

      for (const kw of typeKeywords) {
        if (lower.includes(kw)) {
          words.push(kw)
        }
      }

      if (words.length === 0) {
        words.push(lower)
      }

      return words
    },

    // 从映射面板选择候选
    onSelectMappingCandidate(e: WechatMiniprogram.BaseEvent) {
      const name = e.currentTarget.dataset.name as string
      const { pendingMapping, recognizedIngredients, selectedIngredients } = this.data

      // 添加选中的食材
      if (!selectedIngredients.includes(name)) {
        recognizedIngredients.push({ name, confidence: 0.8, source: 'mapping' } as any);
        selectedIngredients.push(name);
      }

      // 处理下一个
      const nextPending = pendingMapping.slice(1);
      this.setData({ showMappingPanel: false });
      this.processNextMapping(nextPending, recognizedIngredients, selectedIngredients);
    },

    // 跳过当前映射（不添加）
    onSkipMapping() {
      const { pendingMapping, recognizedIngredients, selectedIngredients } = this.data;
      const nextPending = pendingMapping.slice(1);
      this.setData({ showMappingPanel: false });
      this.processNextMapping(nextPending, recognizedIngredients, selectedIngredients);
    },
  },
})
