import React from 'react';
import '../../styles/components/about.css';

export const About: React.FC = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <div className="about-icon">🐊</div>
        <h1>Крокодил</h1>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>🎮 Как играть?</h2>
          <div className="about-grid">
            <div className="about-card">
              <div className="card-icon">👑</div>
              <h3>Стань ведущим</h3>
              <p>Создай комнату или присоединись к существующей. Ведущий загадывает слово и рисует его на холсте.</p>
            </div>
            <div className="about-card">
              <div className="card-icon">🎨</div>
              <h3>Рисуй</h3>
              <p>Используй кисти разных цветов и размеров, чтобы нарисовать загаданное слово. Ластик поможет исправить ошибки.</p>
            </div>
            <div className="about-card">
              <div className="card-icon">💬</div>
              <h3>Угадывай</h3>
              <p>Пиши свои варианты в чат. Кто угадает слово — становится новым ведущим!</p>
            </div>
            <div className="about-card">
              <div className="card-icon">🏆</div>
              <h3>Побеждай</h3>
              <p>Стань лучшим игроком!</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>✨ Особенности игры</h2>
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">🎨</span>
              <div className="feature-content">
                <h4>Режим рисования</h4>
                <p>Полноценный холст с настраиваемой кистью, палитрой цветов и поддержкой touch-экранов.</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <div className="feature-content">
                <h4>Чат реального времени</h4>
                <p>Общайся с другими игроками, отправляй сообщения и попытки угадать слово.</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <div className="feature-content">
                <h4>Мультиплеер</h4>
                <p>Играй с друзьями в одной комнате. Поддерживается до 10 игроков одновременно.</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎲</span>
              <div className="feature-content">
                <h4>Свои слова</h4>
                <p>Создавай свои списки слов для игры в каждой комнате.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>🎯 Как создать свою комнату?</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Нажми «Создать комнату»</h4>
                <p>На главном экране нажми кнопку создания новой комнаты.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Настрой параметры</h4>
                <p>Укажи название, описание, максимальное количество игроков и свой список слов.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Пригласи друзей</h4>
                <p>Поделись ссылкой на комнату с друзьями или скажи им ID комнаты.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Начинайте игру!</h4>
                <p>Как только все готовы, начинайте угадывать слова по рисункам.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>🎨 Советы для ведущего</h2>
          <div className="tips-container">
            <div className="tip">
              <span className="tip-icon">✏️</span>
              <p>Не пиши буквы и цифры — только рисунки!</p>
            </div>
            <div className="tip">
              <span className="tip-icon">🎯</span>
              <p>Старайся рисовать основные детали, не отвлекайся на мелочи.</p>
            </div>
            <div className="tip">
              <span className="tip-icon">🖌️</span>
              <p>Используй разные цвета, чтобы выделить важные элементы.</p>
            </div>
            <div className="tip">
              <span className="tip-icon">💡</span>
              <p>Если никто не угадывает, можно нарисовать подсказку — часть слова или ассоциацию.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>💡 Советы для игроков</h2>
          <div className="tips-container">
            <div className="tip">
              <span className="tip-icon">👀</span>
              <p>Смотри внимательно на детали рисунка — они могут быть ключом к разгадке.</p>
            </div>
            <div className="tip">
              <span className="tip-icon">🤔</span>
              <p>Пиши любые догадки — даже неправильный ответ может натолкнуть других на мысль.</p>
            </div>
            <div className="tip">
              <span className="tip-icon">⚡</span>
              <p>Не бойся рисковать — угадал слово, станешь ведущим!</p>
            </div>
            <div className="tip">
              <span className="tip-icon">👥</span>
              <p>Обсуждай рисунок с другими игроками в чате.</p>
            </div>
          </div>
        </section>



        <section className="about-section">
          <h2>🛠️ Технологии</h2>
          <div className="tech-list">
            <span className="tech-tag">React 18</span>
            <span className="tech-tag">TypeScript</span>
            <span className="tech-tag">Redux Toolkit</span>
            <span className="tech-tag">WebSocket</span>
            <span className="tech-tag">FastAPI</span>
            <span className="tech-tag">Vite</span>
            <span className="tech-tag">CSS Modules</span>
          </div>
        </section>
      </div>
    </div>
  );
};