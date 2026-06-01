const API_MENU_URL = 'menu.json'

const { createApp } = Vue
createApp({
    data() {
        return {
            menu: null,
            currentContent: '',
            currentUrl: '',
            activeCategory: null,
            isMobile: window.innerWidth <= 640
        }
    },
    computed: {
        /** 桌面端显示全部分类；移动端仅显示当前选中分类 */
        displayMenu() {
            if (!this.menu?.Menu) return {}
            if (!this.isMobile) return this.menu.Menu
            if (!this.activeCategory) return {}
            const filtered = {}
            filtered[this.activeCategory] = this.menu.Menu[this.activeCategory]
            return filtered
        }
    },
    methods: {
        /** 根据 URL 反查所属分类（用于高亮当前分类） */
        findCategoryForUrl(url) {
            if (!this.menu?.Menu) return null
            for (const [cat, items] of Object.entries(this.menu.Menu)) {
                for (const itemUrl of Object.values(items)) {
                    if (itemUrl === url) return cat
                }
            }
            return Object.keys(this.menu.Menu)[0]
        },
        /** #keyboard → keyboard.html */
        hashToUrl(hash) {
            if (!hash) return null
            const key = hash.replace(/^#/, '')
            return key ? key + '.html' : null
        },
        /** keyboard.html → #keyboard */
        urlToHash(url) {
            return url.replace(/\.html$/, '')
        },
        async loadPage(url) {
            if (!url) return
            try {
                const res = await fetch(url)
                if (!res.ok) throw new Error(res.statusText)
                this.currentContent = await res.text()
                this.currentUrl = url
                this.activeCategory = this.findCategoryForUrl(url)
                // 将当前页面写入 URL hash，支持书签/分享（默认页不写 hash）
                if (url !== 'intro.html') {
                    window.location.hash = this.urlToHash(url)
                } else {
                    history.replaceState(null, '', window.location.pathname)
                }
                // 切换页面后滚动到内容区顶部
                document.querySelector('.container')?.scrollTo({ top: 0, behavior: 'smooth' })
            } catch (e) {
                this.currentContent = '<p>加载失败，请稍后重试。</p>'
                console.error('页面加载失败:', e)
            }
        }
    },
    async mounted() {
        try {
            const res = await fetch(API_MENU_URL)
            if (!res.ok) throw new Error(res.statusText)
            const data = await res.json()
            this.menu = data
            this.activeCategory = Object.keys(data.Menu)[0]
            // 从 URL hash 恢复上次查看的页面，否则加载默认页
            const url = this.hashToUrl(window.location.hash)
            this.loadPage(url || 'intro.html')
        } catch (e) {
            console.error('菜单加载失败:', e)
        }
        // 监听窗口尺寸变化，同步移动/桌面布局状态
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 640
        })
        // 监听 hash 变化（浏览器前进/后退）
        window.addEventListener('hashchange', () => {
            const url = this.hashToUrl(window.location.hash)
            if (url && url !== this.currentUrl) this.loadPage(url)
        })
    }
}).mount('#app')
