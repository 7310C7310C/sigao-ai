/**
 * 设置控制功能 - 字号和夜间模式
 * ES5 语法，兼容旧浏览器
 */

(function() {
    'use strict';
    
    var FONT_SIZE_KEY = 'bible_font_size';
    var THEME_KEY = 'bible_theme';
    var DEFAULT_SIZE = 18; // 默认字号对应"默认"选项
    var DEFAULT_THEME = 'light';
    
    /**
     * 获取保存的字号
     */
    function getSavedFontSize() {
        try {
            var saved = localStorage.getItem(FONT_SIZE_KEY);
            if (saved) {
                return parseInt(saved, 10);
            }
        } catch (e) {
            console.log('无法读取字号设置');
        }
        return DEFAULT_SIZE;
    }
    
    /**
     * 保存字号设置
     */
    function saveFontSize(size) {
        try {
            localStorage.setItem(FONT_SIZE_KEY, size.toString());
        } catch (e) {
            console.log('无法保存字号设置');
        }
    }
    
    /**
     * 获取保存的主题
     */
    function getSavedTheme() {
        try {
            var saved = localStorage.getItem(THEME_KEY);
            if (saved) {
                return saved;
            }
        } catch (e) {
            console.log('无法读取主题设置');
        }
        return DEFAULT_THEME;
    }
    
    /**
     * 保存主题设置
     */
    function saveTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            console.log('无法保存主题设置');
        }
    }
    
    /**
     * 应用字号到页面
     */
    function applyFontSize(size) {
        document.documentElement.style.fontSize = size + 'px';
        saveFontSize(size);
        
        // 更新按钮激活状态
        var buttons = document.querySelectorAll('[data-action="font-size"]');
        
        for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            var btnSize = parseInt(btn.getAttribute('data-size'), 10);
            if (btnSize === size) {
                btn.className = 'active';
            } else {
                btn.className = '';
            }
        }
    }
    
    /**
     * 应用主题到页面
     */
    function applyTheme(theme) {
        var body = document.body;
        if (theme === 'dark') {
            body.className = 'dark-mode';
        } else {
            body.className = '';
        }
        saveTheme(theme);
        
        // 更新按钮激活状态
        var buttons = document.querySelectorAll('[data-action="theme"]');
        
        for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            var btnTheme = btn.getAttribute('data-theme');
            if (btnTheme === theme) {
                btn.className = 'active';
            } else {
                btn.className = '';
            }
        }
    }
    
    /**
     * 初始化设置控制
     */
    function initSettingsControl() {
        var toggleBtn = document.getElementById('settings-toggle');
        var optionsPanel = document.getElementById('settings-options');
        
        if (!toggleBtn || !optionsPanel) {
            return;
        }
        // 避免重复绑定
        if (toggleBtn.getAttribute('data-initialized') === '1') {
            return;
        }
        
        // 读取保存的设置并应用
        var savedSize = getSavedFontSize();
        var savedTheme = getSavedTheme();
        applyFontSize(savedSize);
        applyTheme(savedTheme);
        
        // 点击按钮切换显示/隐藏
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var isActive = optionsPanel.className.indexOf('active') !== -1;
            if (isActive) {
                optionsPanel.className = 'font-size-options';
            } else {
                optionsPanel.className = 'font-size-options active';
            }
        });
        toggleBtn.setAttribute('data-initialized', '1');
        
        // 点击选项
        var buttons = optionsPanel.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function(e) {
                e.stopPropagation();
                var action = this.getAttribute('data-action');
                
                if (action === 'font-size') {
                    var size = parseInt(this.getAttribute('data-size'), 10);
                    applyFontSize(size);
                } else if (action === 'theme') {
                    var theme = this.getAttribute('data-theme');
                    applyTheme(theme);
                }
            });
        }
        
        // 点击页面其他地方关闭面板
        document.addEventListener('click', function() {
            optionsPanel.className = 'font-size-options';
        });
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSettingsControl);
    } else {
        initSettingsControl();
    }
    // 监听前端路由切换后重新初始化（SPA）
    document.addEventListener('routeChanged', function() {
        try { initSettingsControl(); } catch (e) {}
    });
    
})();
