/**
 * 字号控制功能 - 弹出选择版本
 * ES5 语法，兼容旧浏览器
 */

(function() {
    'use strict';
    
    var STORAGE_KEY = 'bible_font_size';
    var DEFAULT_SIZE = 18;
    
    /**
     * 获取保存的字号
     */
    function getSavedFontSize() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
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
            localStorage.setItem(STORAGE_KEY, size.toString());
        } catch (e) {
            console.log('无法保存字号设置');
        }
    }
    
    /**
     * 应用字号到页面
     */
    function applyFontSize(size) {
        document.documentElement.style.fontSize = size + 'px';
        saveFontSize(size);
        
        // 更新按钮激活状态和主按钮文字
        var toggleBtn = document.getElementById('font-size-toggle');
        var buttons = document.querySelectorAll('.font-size-options button');
        var selectedText = '字号';
        
        for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            var btnSize = parseInt(btn.getAttribute('data-size'), 10);
            if (btnSize === size) {
                btn.className = 'active';
                selectedText = btn.textContent;
            } else {
                btn.className = '';
            }
        }
        
        // 更新主按钮文字
        if (toggleBtn) {
            toggleBtn.textContent = selectedText;
        }
    }
    
    /**
     * 初始化字号控制
     */
    function initFontSizeControl() {
        var toggleBtn = document.getElementById('font-size-toggle');
        var optionsPanel = document.getElementById('font-size-options');
        
        if (!toggleBtn || !optionsPanel) {
            return;
        }
        
        // 读取保存的字号并应用
        var savedSize = getSavedFontSize();
        applyFontSize(savedSize);
        
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
        
        // 点击选项
        var buttons = optionsPanel.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function(e) {
                e.stopPropagation();
                var size = parseInt(this.getAttribute('data-size'), 10);
                applyFontSize(size);
                // 隐藏面板
                optionsPanel.className = 'font-size-options';
            });
        }
        
        // 点击页面其他地方关闭面板
        document.addEventListener('click', function() {
            optionsPanel.className = 'font-size-options';
        });
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFontSizeControl);
    } else {
        initFontSizeControl();
    }
    
})();
