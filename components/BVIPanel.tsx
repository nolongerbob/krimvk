"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Eye } from "lucide-react";
import { getCookie, setCookie, removeCookie, stringToBoolean, speak } from "@/lib/bvi-utils";

interface BVIConfig {
  fontSize: number;
  theme: string;
  images: string;
  letterSpacing: string;
  lineHeight: string;
  speech: boolean;
  fontFamily: string;
  builtElements: boolean;
}

const defaultConfig: BVIConfig = {
  fontSize: 100, // Проценты: 100% = базовый размер, до 200%
  theme: 'white',
  images: 'grayscale',
  letterSpacing: 'normal',
  lineHeight: 'normal',
  speech: true,
  fontFamily: 'arial',
  builtElements: false,
};

export function BVIPanel() {
  const [isActive, setIsActive] = useState(false);
  const [config, setConfig] = useState<BVIConfig>(defaultConfig);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Загружаем состояние из cookies при монтировании
  useEffect(() => {
    const panelActive = stringToBoolean(getCookie('panelActive'));
    if (panelActive) {
      const savedConfig = { ...defaultConfig };
      Object.keys(defaultConfig).forEach((key) => {
        const cookieValue = getCookie(key);
        if (cookieValue !== undefined) {
          if (key === 'fontSize') {
            savedConfig[key] = parseInt(cookieValue) || defaultConfig.fontSize;
          } else if (key === 'speech' || key === 'builtElements') {
            savedConfig[key] = stringToBoolean(cookieValue);
          } else {
            (savedConfig as any)[key] = cookieValue;
          }
        }
      });
      setConfig(savedConfig);
      setIsActive(true);
    }
  }, []);

  const applyStyles = useCallback(() => {
    if (typeof document === 'undefined') return;

    const body = document.body;
    body.classList.add('bvi-active');

    // Создаем обертку для контента
    let bviBody = document.querySelector('.bvi-body') as HTMLElement;
    if (!bviBody) {
      const wrapper = document.createElement('div');
      wrapper.className = 'bvi-body';
      
      // Перемещаем все дочерние элементы body в wrapper
      const children = Array.from(body.childNodes);
      children.forEach((child) => {
        if (child !== wrapper && child.nodeType === Node.ELEMENT_NODE) {
          wrapper.appendChild(child);
        }
      });
      body.appendChild(wrapper);
      bviBody = wrapper;
    }

    // Применяем стили
    // Используем атрибут data-bvi-fontsize для совместимости с CSS
    // Преобразуем проценты (100-200%) в числовое значение для атрибута
    const fontSizeValue = Math.round(10 + (config.fontSize - 100) / 10);
    bviBody.setAttribute('data-bvi-fontsize', fontSizeValue.toString());
    
    // Применяем fontSize к html элементу для глобального изменения
    // Базовый размер обычно 16px, поэтому 100% = 16px, 200% = 32px
    const baseFontSize = 16;
    const fontSizeInPx = (baseFontSize * config.fontSize) / 100;
    const html = document.documentElement;
    html.style.fontSize = `${fontSizeInPx}px`;
    
    // Также применяем к body для надежности
    body.style.fontSize = `${config.fontSize}%`;
    
    // Применяем fontSize к обертке
    bviBody.style.fontSize = `${config.fontSize}%`;
    bviBody.setAttribute('data-bvi-theme', config.theme);
    bviBody.setAttribute('data-bvi-images', config.images);
    bviBody.setAttribute('data-bvi-letterspacing', config.letterSpacing);
    bviBody.setAttribute('data-bvi-lineheight', config.lineHeight);
    bviBody.setAttribute('data-bvi-fontfamily', config.fontFamily);
    bviBody.setAttribute('data-bvi-builtelements', config.builtElements.toString());

    // Обработка изображений
    document.querySelectorAll('img').forEach((img) => {
      if (!img.classList.contains('bvi-no-style')) {
        if (config.images === 'false') {
          (img as HTMLElement).style.display = 'none';
        } else {
          (img as HTMLElement).style.display = '';
          if (config.images === 'grayscale') {
            img.classList.add('bvi-img');
          } else {
            img.classList.remove('bvi-img');
          }
        }
      }
    });

    // Скрываем кнопку открытия
    const openButton = document.querySelector('.bvi-open') as HTMLElement;
    if (openButton) {
      openButton.style.display = 'none';
    }
  }, [config]);

  // Объявляем setupEventListeners ПЕРЕД createPanel, чтобы избежать циклической зависимости
  const setupEventListeners = useCallback((panel: HTMLElement, linkFixed: HTMLElement) => {
    // Размер шрифта - используем актуальное значение из state
    const fontSizeMinus = panel.querySelector('.bvi-fontSize-minus');
    if (fontSizeMinus) {
      fontSizeMinus.addEventListener('click', (e) => {
        e.preventDefault();
        setConfig((prev) => {
          const newSize = Math.max(100, prev.fontSize - 10);
          setCookie('fontSize', newSize.toString());
          if (prev.speech) speak(`Размер шрифта ${newSize} процентов`);
          return { ...prev, fontSize: newSize };
        });
      });
    }

    const fontSizePlus = panel.querySelector('.bvi-fontSize-plus');
    if (fontSizePlus) {
      fontSizePlus.addEventListener('click', (e) => {
        e.preventDefault();
        setConfig((prev) => {
          const newSize = Math.min(200, prev.fontSize + 10);
          setCookie('fontSize', newSize.toString());
          if (prev.speech) speak(`Размер шрифта ${newSize} процентов`);
          return { ...prev, fontSize: newSize };
        });
      });
    }

    // Темы
    ['white', 'black', 'blue', 'brown', 'green'].forEach((theme) => {
      const themeButton = panel.querySelector(`.bvi-theme-${theme}`);
      if (themeButton) {
        themeButton.addEventListener('click', (e) => {
          e.preventDefault();
          setConfig((prev) => {
            setCookie('theme', theme);
            const themes: { [key: string]: string } = {
              white: 'Черный на белом',
              black: 'Белый на черном',
              blue: 'Темно-синий на синем',
              brown: 'Бежевый на коричневом',
              green: 'Зеленый на темно-коричневом',
            };
            if (prev.speech) speak(themes[theme] || '');
            return { ...prev, theme };
          });
        });
      }
    });

    // Изображения
    const imagesOn = panel.querySelector('.bvi-images-on');
    if (imagesOn) {
      imagesOn.addEventListener('click', (e) => {
        e.preventDefault();
        setConfig((prev) => {
          setCookie('images', 'true');
          if (prev.speech) speak('Изображения включены');
          return { ...prev, images: 'true' };
        });
      });
    }

    const imagesOff = panel.querySelector('.bvi-images-off');
    if (imagesOff) {
      imagesOff.addEventListener('click', (e) => {
        e.preventDefault();
        setConfig((prev) => {
          setCookie('images', 'false');
          if (prev.speech) speak('Изображения выключены');
          return { ...prev, images: 'false' };
        });
      });
    }

    const imagesGrayscale = panel.querySelector('.bvi-images-grayscale');
    if (imagesGrayscale) {
      imagesGrayscale.addEventListener('click', (e) => {
        e.preventDefault();
        setConfig((prev) => {
          setCookie('images', 'grayscale');
          if (prev.speech) speak('Изображения в оттенках серого');
          return { ...prev, images: 'grayscale' };
        });
      });
    }

    // Речь
    const speechOn = panel.querySelector('.bvi-speech-on');
    if (speechOn) {
      speechOn.addEventListener('click', (e) => {
        e.preventDefault();
        setConfig((prev) => {
          setCookie('speech', 'true');
          speak('Речь включена');
          return { ...prev, speech: true };
        });
      });
    }

    const speechOff = panel.querySelector('.bvi-speech-off');
    if (speechOff) {
      speechOff.addEventListener('click', (e) => {
        e.preventDefault();
        // Останавливаем речь перед выключением
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        setConfig((prev) => {
          setCookie('speech', 'false');
          return { ...prev, speech: false };
        });
      });
    }

    // Закрытие - простая и надежная реализация
    const closeButton = panel.querySelector('.bvi-close-button');
    if (closeButton) {
      // Удаляем старые обработчики если есть
      const newCloseButton = closeButton.cloneNode(true);
      closeButton.parentNode?.replaceChild(newCloseButton, closeButton);
      
      newCloseButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Сразу останавливаем речь
        if ('speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
          } catch (err) {
            // Игнорируем ошибки
          }
        }
        
        // Очищаем cookies
        Object.keys(defaultConfig).forEach((key) => {
          removeCookie(key);
        });
        removeCookie('panelActive');
        removeCookie('panelHide');
        
        // Обновляем состояние
        setIsActive(false);
        setConfig(defaultConfig);
        
        // Удаляем стили напрямую (не через callback)
        if (typeof document !== 'undefined') {
          const body = document.body;
          body.classList.remove('bvi-active');

          // Удаляем обертку .bvi-body
          const bviBody = document.querySelector('.bvi-body');
          if (bviBody && bviBody.parentNode) {
            const parent = bviBody.parentNode;
            while (bviBody.firstChild) {
              parent.insertBefore(bviBody.firstChild, bviBody);
            }
            parent.removeChild(bviBody);
          }

          // Восстанавливаем изображения
          document.querySelectorAll('img').forEach((img) => {
            img.classList.remove('bvi-img');
            const imgEl = img as HTMLElement;
            imgEl.style.display = '';
            imgEl.style.filter = '';
            imgEl.style.visibility = '';
          });

          // Удаляем все data-атрибуты BVI
          document.querySelectorAll('[data-bvi-theme], [data-bvi-images], [data-bvi-letterspacing], [data-bvi-lineheight], [data-bvi-fontfamily], [data-bvi-builtelements]').forEach((el) => {
            Array.from(el.attributes).forEach((attr) => {
              if (attr.name.startsWith('data-bvi-')) {
                el.removeAttribute(attr.name);
              }
            });
          });

          // Показываем кнопку открытия
          const openButton = document.querySelector('.bvi-open') as HTMLElement;
          if (openButton) {
            openButton.style.display = '';
          }

          // Удаляем панель
          const panelEl = document.querySelector('.bvi-panel');
          if (panelEl) {
            panelEl.remove();
          }

          // Удаляем кнопку показа панели
          const linkFixedEl = document.querySelector('.bvi-link-fixed-top');
          if (linkFixedEl) {
            linkFixedEl.remove();
          }
        }
      });
    }

    // Скрытие/показ панели
    const panelHideButton = panel.querySelector('.bvi-panel-hide-button');
    if (panelHideButton) {
      panelHideButton.addEventListener('click', (e) => {
        e.preventDefault();
        panel.classList.add('bvi-panel-hide');
        linkFixed.classList.remove('bvi-hide');
        linkFixed.classList.add('bvi-show');
        setCookie('panelHide', 'true');
        setConfig((prev) => {
          if (prev.speech) speak('Панель скрыта');
          return prev;
        });
      });
    }

    linkFixed.addEventListener('click', (e) => {
      e.preventDefault();
      panel.classList.remove('bvi-panel-hide');
      linkFixed.classList.remove('bvi-show');
      linkFixed.classList.add('bvi-hide');
      setCookie('panelHide', 'false');
      setConfig((prev) => {
        if (prev.speech) speak('Панель показана');
        return prev;
      });
    });
  }, []);

  const removeStyles = useCallback(() => {
    if (typeof document === 'undefined') return;

    // Останавливаем речь
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const body = document.body;
    body.classList.remove('bvi-active');

    // Восстанавливаем fontSize на html и body
    const html = document.documentElement;
    html.style.fontSize = '';
    body.style.fontSize = '';

    // Удаляем обертку .bvi-body
    const bviBody = document.querySelector('.bvi-body');
    if (bviBody && bviBody.parentNode) {
      const parent = bviBody.parentNode;
      // Перемещаем все дочерние элементы обратно в body
      while (bviBody.firstChild) {
        parent.insertBefore(bviBody.firstChild, bviBody);
      }
      // Удаляем обертку
      parent.removeChild(bviBody);
    }

    // Восстанавливаем все изображения
    document.querySelectorAll('img').forEach((img) => {
      img.classList.remove('bvi-img');
      const imgEl = img as HTMLElement;
      imgEl.style.display = '';
      imgEl.style.filter = '';
      imgEl.style.visibility = '';
    });

    // Удаляем все data-атрибуты BVI со всех элементов
    document.querySelectorAll('[data-bvi-theme], [data-bvi-images], [data-bvi-letterspacing], [data-bvi-lineheight], [data-bvi-fontfamily], [data-bvi-builtelements]').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-bvi-')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    // Удаляем inline стили fontSize
    document.querySelectorAll('[style*="font-size"]').forEach((el) => {
      const elStyle = (el as HTMLElement).style;
      if (elStyle.fontSize) {
        elStyle.fontSize = '';
      }
    });

    // Показываем кнопку открытия
    const openButton = document.querySelector('.bvi-open') as HTMLElement;
    if (openButton) {
      openButton.style.display = '';
    }

    // Удаляем панель
    const panel = document.querySelector('.bvi-panel');
    if (panel) {
      panel.remove();
    }

    // Удаляем кнопку показа панели
    const linkFixed = document.querySelector('.bvi-link-fixed-top');
    if (linkFixed) {
      linkFixed.remove();
    }
  }, []);

  const createPanel = useCallback(() => {
    if (typeof document === 'undefined') return;
    
    // Удаляем старую панель если есть
    const oldPanel = document.querySelector('.bvi-panel');
    if (oldPanel) {
      oldPanel.remove();
    }

    const panel = document.createElement('div');
    panel.className = 'bvi-panel';
    panel.innerHTML = `
      <div class="bvi-blocks bvi-block-center">
        <div class="bvi-block">
          <div class="bvi-block-title">Размер шрифта</div>
          <a href="#" class="bvi-link bvi-fontSize-minus">А-</a>
          <a href="#" class="bvi-link bvi-fontSize-plus">А+</a>
        </div>
        <div class="bvi-block">
          <div class="bvi-block-title">Цвета сайта</div>
          <a href="#" class="bvi-link bvi-theme-white">Ц</a>
          <a href="#" class="bvi-link bvi-theme-black">Ц</a>
          <a href="#" class="bvi-link bvi-theme-blue">Ц</a>
          <a href="#" class="bvi-link bvi-theme-brown">Ц</a>
          <a href="#" class="bvi-link bvi-theme-green">Ц</a>
        </div>
        <div class="bvi-block">
          <div class="bvi-block-title">Изображения</div>
          <a href="#" class="bvi-link bvi-images-on">
            <i class="bvi-images bvi-images-image"></i>
          </a>
          <a href="#" class="bvi-link bvi-images-off">
            <i class="bvi-images bvi-images-minus-circle"></i>
          </a>
          <a href="#" class="bvi-link bvi-images-grayscale">
            <i class="bvi-images bvi-images-adjust"></i>
          </a>
        </div>
        <div class="bvi-block">
          <div class="bvi-block-title">Речь</div>
          <a href="#" class="bvi-link bvi-speech-off">
            <i class="bvi-images bvi-images-volume-off"></i>
          </a>
          <a href="#" class="bvi-link bvi-speech-on">
            <i class="bvi-images bvi-images-volume-up"></i>
          </a>
        </div>
        <div class="bvi-block">
          <div class="bvi-block-title">Настройки</div>
          <a href="#" class="bvi-link bvi-close-button">Обычная версия сайта</a>
          <a href="#" class="bvi-link bvi-panel-hide-button">
            <i class="bvi-images bvi-images-minus"></i>
          </a>
        </div>
      </div>
    `;

    document.body.insertBefore(panel, document.body.firstChild);
    panelRef.current = panel;

    // Создаем кнопку для показа панели (когда она скрыта)
    const oldLinkFixed = document.querySelector('.bvi-link-fixed-top');
    if (oldLinkFixed) {
      oldLinkFixed.remove();
    }

    const linkFixed = document.createElement('a');
    linkFixed.href = '#';
    linkFixed.className = 'bvi-link bvi-link-fixed-top bvi-hide';
    linkFixed.innerHTML = '<i class="bvi-images bvi-images-eye bvi-images-size-32"></i>';
    document.body.insertBefore(linkFixed, document.body.firstChild);

    // Добавляем обработчики событий
    setupEventListeners(panel, linkFixed);
  }, [setupEventListeners]);

  const handleOpen = useCallback(() => {
    if (isActive) return;

    // Сохраняем конфигурацию в cookies
    Object.keys(config).forEach((key) => {
      setCookie(key, (config as any)[key].toString());
    });
    setCookie('panelActive', 'true');

    setIsActive(true);
    if (config.speech) {
      setTimeout(() => speak('Версия для слабовидящих включена'), 100);
    }
  }, [isActive, config]);

  // Применяем стили когда активна панель (объявлен после всех функций, которые использует)
  useEffect(() => {
    if (isActive) {
      applyStyles();
      // Небольшая задержка для создания панели после применения стилей
      const timer = setTimeout(() => {
        createPanel();
      }, 50);
      return () => clearTimeout(timer);
    }
    // Не вызываем removeStyles здесь, так как это делается напрямую в обработчике закрытия
  }, [isActive, config, applyStyles, createPanel]);

  // Слушаем событие открытия от кнопки в Header
  useEffect(() => {
    const handleBVIOpen = () => {
      handleOpen();
    };

    window.addEventListener('bvi-open', handleBVIOpen);
    return () => {
      window.removeEventListener('bvi-open', handleBVIOpen);
    };
  }, [handleOpen]);

  // Уведомляем о изменении состояния
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('bvi-state-change'));
  }, [isActive]);


  // Кнопка теперь в Header, поэтому не рендерим её здесь
  return null;
}
