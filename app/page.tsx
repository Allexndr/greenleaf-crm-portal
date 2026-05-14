'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Greenleaf Global</h1>
                <p className="text-xs text-gray-500">Инвестиционная платформа</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">О компании</a>
              <a href="#services" className="text-gray-600 hover:text-gray-900 transition-colors">Услуги</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">Контакты</a>
              <Button 
                onClick={() => window.location.href = '/admin-auth/login'}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
              >
                Вход для администраторов
              </Button>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-64 bg-white">
            <div className="p-4">
              <button onClick={() => setMobileMenuOpen(false)} className="mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <nav className="flex flex-col gap-4">
                <a href="#about" className="text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>О компании</a>
                <a href="#services" className="text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Услуги</a>
                <a href="#contact" className="text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Контакты</a>
                <Button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.location.href = '/admin-auth/login';
                  }}
                  className="w-full"
                >
                  Вход для администраторов
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              Глобальные инвестиционные возможности
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Greenleaf{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Global Group
              </span>
            </h2>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Стратегические инвестиции в инновационные проекты по всему миру. 
              Мы обеспечиваем доступ к эксклюзивным возможностям для создания богатства.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/register?sc=68ce92ea47d698e84e885939'}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-semibold"
              >
                Подать заявку на регистрацию
              </Button>
              <Button 
                onClick={() => window.location.href = '/status?sc=68ce92ea47d698e84e885939'}
                variant="outline"
                className="px-8 py-4 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-xl font-semibold"
              >
                Проверить статус заявки
              </Button>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: '$500M', label: 'Целевой AUM к 2026' },
              { value: '60+', label: 'Стран присутствия' },
              { value: '24/7', label: 'Поддержка клиентов' },
              { value: '100%', label: 'Прозрачность' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-emerald-600">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">О компании Greenleaf</h3>
              <p className="text-lg text-gray-600 mb-6">
                Greenleaf Global Group — ведущая инвестиционная компания, специализирующаяся на 
                стратегических инвестициях в инновационные проекты по всему миру. Мы используем 
                глобальные рыночные тенденции и стратегические партнерства для доставки исключительной 
                стоимости нашим инвесторам.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Наша миссия — обеспечить ясность, уверенность и доступ к эксклюзивным возможностям, 
                формируя будущее создания богатства.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-emerald-50 px-4 py-2 rounded-lg">
                  <span className="text-emerald-700 font-medium">Инвестиции</span>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg">
                  <span className="text-green-700 font-medium">Консалтинг</span>
                </div>
                <div className="bg-emerald-50 px-4 py-2 rounded-lg">
                  <span className="text-emerald-700 font-medium">Управление активами</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-8 text-white">
              <div className="text-6xl font-bold mb-4">🌍</div>
              <div className="text-2xl font-semibold mb-2">Глобальное присутствие</div>
              <div className="text-emerald-100">
                Офисы в 60+ странах с локальной экспертизой и глобальным охватом
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Activity */}
      <section className="py-8 bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-10 text-sm">
          {[
            { icon: '💰', text: 'Новый инвестор из Дубая · 2 мин назад' },
            { icon: '📈', text: 'Доходность портфеля за май: +8.4%' },
            { icon: '🌏', text: 'Активных инвесторов сегодня: 1 247' },
            { icon: '✅', text: 'Одобрено заявок за неделю: 83' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-emerald-100">
              <span>{item.icon}</span><span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Investment Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">Инвестиционные продукты</div>
            <h3 className="text-3xl font-bold text-gray-900">Выберите стратегию</h3>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Три уровня входа — от консервативного сохранения капитала до агрессивного роста</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Greenleaf Stable', tag: 'Консервативный', return: '8–12%', min: '$5 000', period: '12 месяцев', color: 'border-gray-200', badge: '' },
              { name: 'Greenleaf Growth', tag: 'Сбалансированный', return: '18–24%', min: '$15 000', period: '18 месяцев', color: 'border-emerald-400 ring-2 ring-emerald-200', badge: '🔥 Популярный' },
              { name: 'Greenleaf Premium', tag: 'Агрессивный', return: '30–40%', min: '$50 000', period: '24 месяца', color: 'border-gray-200', badge: '' },
            ].map((p, i) => (
              <div key={i} className={`border-2 ${p.color} rounded-2xl p-6 relative`}>
                {p.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">{p.badge}</span>}
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{p.tag}</div>
                <h4 className="text-xl font-black text-gray-900 mb-4">{p.name}</h4>
                <div className="text-4xl font-black text-emerald-600 mb-1">{p.return}</div>
                <div className="text-sm text-gray-500 mb-6">годовая доходность</div>
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <div className="flex justify-between"><span>Минимальный вход</span><strong>{p.min}</strong></div>
                  <div className="flex justify-between"><span>Срок</span><strong>{p.period}</strong></div>
                  <div className="flex justify-between"><span>Выплаты</span><strong>Ежеквартально</strong></div>
                </div>
                <a href="/register?sc=68ce92ea47d698e84e885939"
                  className="block w-full text-center bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
                  Подать заявку
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#f8faf8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900">Наши инвесторы</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Karim Al-Rashid', country: '🇦🇪 ОАЭ', text: 'Инвестирую через Greenleaf уже второй год. Доходность Growth-портфеля превысила 22% — значительно выше рынка.', product: 'Greenleaf Growth' },
              { name: 'Светлана М.', country: '🇷🇺 Россия', text: 'Надёжная платформа с прозрачной отчётностью. Менеджер всегда на связи, вопросы решаются быстро.', product: 'Greenleaf Stable' },
              { name: 'Алибек Н.', country: '🇰🇿 Казахстан', text: 'Начал с консервативного продукта, через 6 месяцев перешёл на Premium. Доволен результатами.', product: 'Greenleaf Premium' },
            ].map((r, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold">{r.name[0]}</div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{r.name}</div>
                    <div className="text-xs text-gray-400">{r.country} · {r.product}</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">«{r.text}»</p>
                <div className="flex mt-3">{[...Array(5)].map((_, j) => <span key={j} className="text-yellow-400 text-sm">★</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="services" className="py-20 bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Система регистрации</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Станьте частью глобальной инвестиционной платформы Greenleaf
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">📝</div>
                <h4 className="text-2xl font-bold text-gray-900">Регистрация</h4>
                <p className="text-gray-600">Подать заявку на регистрацию</p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6">
                  Заполните форму регистрации для доступа к платформе. После рассмотрения заявки 
                  вы получите логин и временный пароль.
                </p>
                <Button 
                  onClick={() => window.location.href = '/register?sc=68ce92ea47d698e84e885939'}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                >
                  Подать заявку
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">🔍</div>
                <h4 className="text-2xl font-bold text-gray-900">Статус заявки</h4>
                <p className="text-gray-600">Проверить статус поданной заявки</p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6">
                  Введите номер заявки и телефон для проверки статуса. При утверждении 
                  вы увидите свои данные для входа в систему.
                </p>
                <Button 
                  onClick={() => window.location.href = '/status?sc=68ce92ea47d698e84e885939'}
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                >
                  Проверить статус
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">G</span>
                </div>
                <span className="font-bold text-xl">Greenleaf Global</span>
              </div>
              <p className="text-gray-400">
                Глобальная инвестиционная платформа для создания богатства
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Навигация</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors">О компании</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Услуги</a></li>
                <li><a href="/admin-auth/login" className="hover:text-white transition-colors">Админ панель</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Контакты</h4>
              <ul className="space-y-2 text-gray-400">
                <li>info@greenleaf-global.com</li>
                <li>+1 (555) 123-4567</li>
                <li>Global HQ</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Greenleaf Global Group. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


