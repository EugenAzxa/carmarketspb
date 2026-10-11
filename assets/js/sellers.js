// Sellers (media resellers). Each one brings their own brand: colors, logo, plate frame.
window.SELLERS = {
  'lex-auto': {
    id: 'lex-auto',
    name: 'Lex Auto',
    plate: 'ЛЕКСАВТО',
    person: 'Лёха Лекс Авто',
    title: 'Тачки от Лекс Авто',
    tagline: 'Наши цены реальны. Здесь продаются авто, на которых ты точно заработаешь.',
    city: 'Санкт-Петербург',
    subscribers: 229000,
    media: { photos: '64.7K', videos: '5.47K' },
    avatar: 'assets/img/sellers/lex-auto/avatar.jpg',
    cutout: 'assets/img/sellers/lex-auto/lexa-cutout.png',
    cover: 'assets/img/sellers/lex-auto/lexa-rr2.jpg',
    theme: 'neon',
    colors: { a: '#ff2bd6', b: '#7a2cff', gold: '#f2b84b' },
    verified: true,
    rkn: 'https://clck.ru/3Qu5pP',
    links: {
      channel: 'https://t.me/lexautospb13',
      contact: 'https://t.me/lexautospb',
      instagram: 'https://www.instagram.com/lex_auto_spb/',
      max: 'https://max.ru/lex_auto_ru'
    },
    phone: '+79991679220',
    phoneLabel: '+7 999 167-92-20',
    contactHandle: 'lexautospb',
    // posted in the channel but not on sale yet
    upcoming: [
      {
        title: 'Volkswagen Polo рестайлинг 2020',
        img: 'assets/img/cars/anons-vw-polo-2020.jpg',
        price: 950000,
        avito: 1200000,
        specs: ['1.6 бензин, автомат', '96 000 км по базе', '3 владельца'],
        note: 'Не такси, не каршеринг. Почти вся в родной краске, буквально 2 окраса.',
        source: 'https://t.me/lexautospb13/163130'
      }
    ]
  },
  'perekupchino': {
    id: 'perekupchino',
    name: 'Перекупчино',
    plate: 'ПЕРЕКУПЧИНО',
    person: 'Вова Перекупчино',
    title: 'Перекупчино',
    tagline: 'Живая история одного парня. Покупает и продаёт машины, самые сочные варианты - первым у себя в канале.',
    city: 'Санкт-Петербург',
    subscribers: 257000,
    carsChannelSubs: 153000,
    avatar: 'assets/img/sellers/perekupchino/avatar.jpg',
    logo: 'assets/img/sellers/perekupchino/logo-white.png',
    cutout: null,
    theme: 'grunge',
    colors: { a: '#f3f1ea', b: '#0e0e0e', gold: '#ff3b2f' },
    verified: true,
    links: {
      channel: 'https://t.me/perekupchino_777',
      contact: 'https://t.me/pak_info',
      instagram: 'https://www.instagram.com/perekupchino/'
    },
    contactHandle: 'pak_info',
    phone: '+79646111171',
    phoneLabel: '+7 964 611-11-71',
    upcoming: []
  }
};
