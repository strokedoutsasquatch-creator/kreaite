export type SupportedLocale = 
  | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'nl' | 'pl' | 'ru'
  | 'ja' | 'zh' | 'ko' | 'ar' | 'hi' | 'th' | 'vi' | 'id' | 'tr' | 'he' | 'sv';

export interface TranslationKeys {
  common: {
    home: string;
    studios: string;
    marketplace: string;
    create: string;
    publish: string;
    earn: string;
    settings: string;
    profile: string;
    logout: string;
    login: string;
    signup: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    loading: string;
    error: string;
    success: string;
    credits: string;
    price: string;
    buy: string;
    sell: string;
    search: string;
  };
  studios: {
    book: string;
    video: string;
    music: string;
    course: string;
    image: string;
    doctrine: string;
  };
  ai: {
    generating: string;
    qualityTier: string;
    voicePreset: string;
    customVoice: string;
    draft: string;
    standard: string;
    premium: string;
    ultra: string;
  };
  marketplace: {
    browse: string;
    featured: string;
    bestsellers: string;
    newReleases: string;
    categories: string;
    addToCart: string;
    checkout: string;
    reviews: string;
    rating: string;
    creatorEarnings: string;
  };
  errors: {
    insufficientCredits: string;
    networkError: string;
    unauthorized: string;
    notFound: string;
    serverError: string;
  };
}

const translations: Record<SupportedLocale, TranslationKeys> = {
  en: {
    common: {
      home: 'Home',
      studios: 'Studios',
      marketplace: 'Marketplace',
      create: 'Create',
      publish: 'Publish',
      earn: 'Earn',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Log Out',
      login: 'Log In',
      signup: 'Sign Up',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      credits: 'Credits',
      price: 'Price',
      buy: 'Buy',
      sell: 'Sell',
      search: 'Search',
    },
    studios: {
      book: 'Book Studio',
      video: 'Video Studio',
      music: 'Music Studio',
      course: 'Course Builder',
      image: 'Image Studio',
      doctrine: 'Doctrine Engine',
    },
    ai: {
      generating: 'Generating...',
      qualityTier: 'Quality Tier',
      voicePreset: 'Voice Preset',
      customVoice: 'Custom Voice',
      draft: 'Draft',
      standard: 'Standard',
      premium: 'Premium',
      ultra: 'Ultra',
    },
    marketplace: {
      browse: 'Browse',
      featured: 'Featured',
      bestsellers: 'Bestsellers',
      newReleases: 'New Releases',
      categories: 'Categories',
      addToCart: 'Add to Cart',
      checkout: 'Checkout',
      reviews: 'Reviews',
      rating: 'Rating',
      creatorEarnings: 'Creator Earnings',
    },
    errors: {
      insufficientCredits: 'Insufficient credits. Please purchase more.',
      networkError: 'Network error. Please try again.',
      unauthorized: 'Please log in to continue.',
      notFound: 'Not found.',
      serverError: 'Server error. Please try again later.',
    },
  },
  es: {
    common: {
      home: 'Inicio',
      studios: 'Estudios',
      marketplace: 'Mercado',
      create: 'Crear',
      publish: 'Publicar',
      earn: 'Ganar',
      settings: 'Configuración',
      profile: 'Perfil',
      logout: 'Cerrar Sesión',
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      credits: 'Créditos',
      price: 'Precio',
      buy: 'Comprar',
      sell: 'Vender',
      search: 'Buscar',
    },
    studios: {
      book: 'Estudio de Libros',
      video: 'Estudio de Video',
      music: 'Estudio de Música',
      course: 'Constructor de Cursos',
      image: 'Estudio de Imágenes',
      doctrine: 'Motor de Doctrina',
    },
    ai: {
      generating: 'Generando...',
      qualityTier: 'Nivel de Calidad',
      voicePreset: 'Voz Predefinida',
      customVoice: 'Voz Personalizada',
      draft: 'Borrador',
      standard: 'Estándar',
      premium: 'Premium',
      ultra: 'Ultra',
    },
    marketplace: {
      browse: 'Explorar',
      featured: 'Destacados',
      bestsellers: 'Más Vendidos',
      newReleases: 'Novedades',
      categories: 'Categorías',
      addToCart: 'Añadir al Carrito',
      checkout: 'Pagar',
      reviews: 'Reseñas',
      rating: 'Calificación',
      creatorEarnings: 'Ganancias del Creador',
    },
    errors: {
      insufficientCredits: 'Créditos insuficientes. Por favor compre más.',
      networkError: 'Error de red. Por favor intente de nuevo.',
      unauthorized: 'Por favor inicie sesión para continuar.',
      notFound: 'No encontrado.',
      serverError: 'Error del servidor. Intente más tarde.',
    },
  },
  fr: {
    common: {
      home: 'Accueil',
      studios: 'Studios',
      marketplace: 'Marché',
      create: 'Créer',
      publish: 'Publier',
      earn: 'Gagner',
      settings: 'Paramètres',
      profile: 'Profil',
      logout: 'Déconnexion',
      login: 'Connexion',
      signup: 'Inscription',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      credits: 'Crédits',
      price: 'Prix',
      buy: 'Acheter',
      sell: 'Vendre',
      search: 'Rechercher',
    },
    studios: {
      book: 'Studio Livre',
      video: 'Studio Vidéo',
      music: 'Studio Musique',
      course: 'Créateur de Cours',
      image: 'Studio Image',
      doctrine: 'Moteur Doctrine',
    },
    ai: {
      generating: 'Génération...',
      qualityTier: 'Niveau de Qualité',
      voicePreset: 'Voix Prédéfinie',
      customVoice: 'Voix Personnalisée',
      draft: 'Brouillon',
      standard: 'Standard',
      premium: 'Premium',
      ultra: 'Ultra',
    },
    marketplace: {
      browse: 'Parcourir',
      featured: 'En Vedette',
      bestsellers: 'Meilleures Ventes',
      newReleases: 'Nouveautés',
      categories: 'Catégories',
      addToCart: 'Ajouter au Panier',
      checkout: 'Commander',
      reviews: 'Avis',
      rating: 'Note',
      creatorEarnings: 'Revenus Créateur',
    },
    errors: {
      insufficientCredits: 'Crédits insuffisants. Veuillez en acheter.',
      networkError: 'Erreur réseau. Veuillez réessayer.',
      unauthorized: 'Veuillez vous connecter pour continuer.',
      notFound: 'Non trouvé.',
      serverError: 'Erreur serveur. Réessayez plus tard.',
    },
  },
  de: {
    common: {
      home: 'Startseite',
      studios: 'Studios',
      marketplace: 'Marktplatz',
      create: 'Erstellen',
      publish: 'Veröffentlichen',
      earn: 'Verdienen',
      settings: 'Einstellungen',
      profile: 'Profil',
      logout: 'Abmelden',
      login: 'Anmelden',
      signup: 'Registrieren',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      loading: 'Laden...',
      error: 'Fehler',
      success: 'Erfolg',
      credits: 'Guthaben',
      price: 'Preis',
      buy: 'Kaufen',
      sell: 'Verkaufen',
      search: 'Suchen',
    },
    studios: {
      book: 'Buch-Studio',
      video: 'Video-Studio',
      music: 'Musik-Studio',
      course: 'Kurs-Ersteller',
      image: 'Bild-Studio',
      doctrine: 'Doktrin-Engine',
    },
    ai: {
      generating: 'Generierung...',
      qualityTier: 'Qualitätsstufe',
      voicePreset: 'Stimmvoreinstellung',
      customVoice: 'Benutzerdefinierte Stimme',
      draft: 'Entwurf',
      standard: 'Standard',
      premium: 'Premium',
      ultra: 'Ultra',
    },
    marketplace: {
      browse: 'Durchsuchen',
      featured: 'Empfohlen',
      bestsellers: 'Bestseller',
      newReleases: 'Neuerscheinungen',
      categories: 'Kategorien',
      addToCart: 'In den Warenkorb',
      checkout: 'Zur Kasse',
      reviews: 'Bewertungen',
      rating: 'Bewertung',
      creatorEarnings: 'Schöpfer-Einnahmen',
    },
    errors: {
      insufficientCredits: 'Unzureichendes Guthaben. Bitte kaufen Sie mehr.',
      networkError: 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
      unauthorized: 'Bitte melden Sie sich an.',
      notFound: 'Nicht gefunden.',
      serverError: 'Serverfehler. Bitte später erneut versuchen.',
    },
  },
  ja: {
    common: {
      home: 'ホーム',
      studios: 'スタジオ',
      marketplace: 'マーケット',
      create: '作成',
      publish: '公開',
      earn: '収益',
      settings: '設定',
      profile: 'プロフィール',
      logout: 'ログアウト',
      login: 'ログイン',
      signup: '新規登録',
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      credits: 'クレジット',
      price: '価格',
      buy: '購入',
      sell: '販売',
      search: '検索',
    },
    studios: {
      book: 'ブックスタジオ',
      video: 'ビデオスタジオ',
      music: 'ミュージックスタジオ',
      course: 'コースビルダー',
      image: 'イメージスタジオ',
      doctrine: 'ドクトリンエンジン',
    },
    ai: {
      generating: '生成中...',
      qualityTier: '品質レベル',
      voicePreset: '音声プリセット',
      customVoice: 'カスタム音声',
      draft: 'ドラフト',
      standard: 'スタンダード',
      premium: 'プレミアム',
      ultra: 'ウルトラ',
    },
    marketplace: {
      browse: '閲覧',
      featured: 'おすすめ',
      bestsellers: 'ベストセラー',
      newReleases: '新着',
      categories: 'カテゴリー',
      addToCart: 'カートに追加',
      checkout: '購入手続き',
      reviews: 'レビュー',
      rating: '評価',
      creatorEarnings: 'クリエイター収益',
    },
    errors: {
      insufficientCredits: 'クレジットが不足しています。追加購入してください。',
      networkError: 'ネットワークエラー。再試行してください。',
      unauthorized: 'ログインしてください。',
      notFound: '見つかりませんでした。',
      serverError: 'サーバーエラー。後でお試しください。',
    },
  },
  zh: {
    common: {
      home: '首页',
      studios: '工作室',
      marketplace: '市场',
      create: '创建',
      publish: '发布',
      earn: '收益',
      settings: '设置',
      profile: '个人资料',
      logout: '退出',
      login: '登录',
      signup: '注册',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      credits: '积分',
      price: '价格',
      buy: '购买',
      sell: '出售',
      search: '搜索',
    },
    studios: {
      book: '书籍工作室',
      video: '视频工作室',
      music: '音乐工作室',
      course: '课程构建器',
      image: '图像工作室',
      doctrine: '教义引擎',
    },
    ai: {
      generating: '生成中...',
      qualityTier: '质量等级',
      voicePreset: '语音预设',
      customVoice: '自定义语音',
      draft: '草稿',
      standard: '标准',
      premium: '高级',
      ultra: '超级',
    },
    marketplace: {
      browse: '浏览',
      featured: '精选',
      bestsellers: '畅销',
      newReleases: '新品',
      categories: '分类',
      addToCart: '加入购物车',
      checkout: '结算',
      reviews: '评价',
      rating: '评分',
      creatorEarnings: '创作者收益',
    },
    errors: {
      insufficientCredits: '积分不足，请购买更多。',
      networkError: '网络错误，请重试。',
      unauthorized: '请登录后继续。',
      notFound: '未找到。',
      serverError: '服务器错误，请稍后再试。',
    },
  },
  ko: {
    common: {
      home: '홈',
      studios: '스튜디오',
      marketplace: '마켓',
      create: '만들기',
      publish: '게시',
      earn: '수익',
      settings: '설정',
      profile: '프로필',
      logout: '로그아웃',
      login: '로그인',
      signup: '가입',
      save: '저장',
      cancel: '취소',
      delete: '삭제',
      edit: '편집',
      loading: '로딩...',
      error: '오류',
      success: '성공',
      credits: '크레딧',
      price: '가격',
      buy: '구매',
      sell: '판매',
      search: '검색',
    },
    studios: {
      book: '북 스튜디오',
      video: '비디오 스튜디오',
      music: '뮤직 스튜디오',
      course: '코스 빌더',
      image: '이미지 스튜디오',
      doctrine: '독트린 엔진',
    },
    ai: {
      generating: '생성 중...',
      qualityTier: '품질 등급',
      voicePreset: '음성 프리셋',
      customVoice: '커스텀 음성',
      draft: '초안',
      standard: '표준',
      premium: '프리미엄',
      ultra: '울트라',
    },
    marketplace: {
      browse: '둘러보기',
      featured: '추천',
      bestsellers: '베스트셀러',
      newReleases: '신규',
      categories: '카테고리',
      addToCart: '장바구니 추가',
      checkout: '결제',
      reviews: '리뷰',
      rating: '평점',
      creatorEarnings: '크리에이터 수익',
    },
    errors: {
      insufficientCredits: '크레딧이 부족합니다. 충전해 주세요.',
      networkError: '네트워크 오류. 다시 시도하세요.',
      unauthorized: '로그인이 필요합니다.',
      notFound: '찾을 수 없습니다.',
      serverError: '서버 오류. 나중에 다시 시도하세요.',
    },
  },
  ar: {
    common: {
      home: 'الرئيسية',
      studios: 'الاستوديوهات',
      marketplace: 'السوق',
      create: 'إنشاء',
      publish: 'نشر',
      earn: 'كسب',
      settings: 'الإعدادات',
      profile: 'الملف الشخصي',
      logout: 'تسجيل الخروج',
      login: 'تسجيل الدخول',
      signup: 'إنشاء حساب',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      loading: 'جار التحميل...',
      error: 'خطأ',
      success: 'نجاح',
      credits: 'رصيد',
      price: 'السعر',
      buy: 'شراء',
      sell: 'بيع',
      search: 'بحث',
    },
    studios: {
      book: 'استوديو الكتب',
      video: 'استوديو الفيديو',
      music: 'استوديو الموسيقى',
      course: 'منشئ الدورات',
      image: 'استوديو الصور',
      doctrine: 'محرك العقيدة',
    },
    ai: {
      generating: 'جار الإنشاء...',
      qualityTier: 'مستوى الجودة',
      voicePreset: 'إعداد الصوت',
      customVoice: 'صوت مخصص',
      draft: 'مسودة',
      standard: 'قياسي',
      premium: 'متميز',
      ultra: 'فائق',
    },
    marketplace: {
      browse: 'تصفح',
      featured: 'مميز',
      bestsellers: 'الأكثر مبيعاً',
      newReleases: 'جديد',
      categories: 'الفئات',
      addToCart: 'أضف للسلة',
      checkout: 'الدفع',
      reviews: 'التقييمات',
      rating: 'التقييم',
      creatorEarnings: 'أرباح المنشئ',
    },
    errors: {
      insufficientCredits: 'رصيد غير كافٍ. يرجى الشراء.',
      networkError: 'خطأ في الشبكة. حاول مجدداً.',
      unauthorized: 'يرجى تسجيل الدخول.',
      notFound: 'غير موجود.',
      serverError: 'خطأ في الخادم. حاول لاحقاً.',
    },
  },
  it: { common: { home: 'Home', studios: 'Studi', marketplace: 'Mercato', create: 'Crea', publish: 'Pubblica', earn: 'Guadagna', settings: 'Impostazioni', profile: 'Profilo', logout: 'Esci', login: 'Accedi', signup: 'Registrati', save: 'Salva', cancel: 'Annulla', delete: 'Elimina', edit: 'Modifica', loading: 'Caricamento...', error: 'Errore', success: 'Successo', credits: 'Crediti', price: 'Prezzo', buy: 'Compra', sell: 'Vendi', search: 'Cerca' }, studios: { book: 'Studio Libri', video: 'Studio Video', music: 'Studio Musica', course: 'Creatore Corsi', image: 'Studio Immagini', doctrine: 'Motore Dottrina' }, ai: { generating: 'Generazione...', qualityTier: 'Livello Qualità', voicePreset: 'Voce Predefinita', customVoice: 'Voce Personalizzata', draft: 'Bozza', standard: 'Standard', premium: 'Premium', ultra: 'Ultra' }, marketplace: { browse: 'Sfoglia', featured: 'In Evidenza', bestsellers: 'Bestseller', newReleases: 'Novità', categories: 'Categorie', addToCart: 'Aggiungi al Carrello', checkout: 'Checkout', reviews: 'Recensioni', rating: 'Valutazione', creatorEarnings: 'Guadagni Creatore' }, errors: { insufficientCredits: 'Crediti insufficienti.', networkError: 'Errore di rete.', unauthorized: 'Effettua l\'accesso.', notFound: 'Non trovato.', serverError: 'Errore server.' } },
  pt: { common: { home: 'Início', studios: 'Estúdios', marketplace: 'Mercado', create: 'Criar', publish: 'Publicar', earn: 'Ganhar', settings: 'Configurações', profile: 'Perfil', logout: 'Sair', login: 'Entrar', signup: 'Cadastrar', save: 'Salvar', cancel: 'Cancelar', delete: 'Excluir', edit: 'Editar', loading: 'Carregando...', error: 'Erro', success: 'Sucesso', credits: 'Créditos', price: 'Preço', buy: 'Comprar', sell: 'Vender', search: 'Buscar' }, studios: { book: 'Estúdio de Livros', video: 'Estúdio de Vídeo', music: 'Estúdio de Música', course: 'Criador de Cursos', image: 'Estúdio de Imagens', doctrine: 'Motor de Doutrina' }, ai: { generating: 'Gerando...', qualityTier: 'Nível de Qualidade', voicePreset: 'Voz Predefinida', customVoice: 'Voz Personalizada', draft: 'Rascunho', standard: 'Padrão', premium: 'Premium', ultra: 'Ultra' }, marketplace: { browse: 'Explorar', featured: 'Destaque', bestsellers: 'Mais Vendidos', newReleases: 'Lançamentos', categories: 'Categorias', addToCart: 'Adicionar ao Carrinho', checkout: 'Finalizar', reviews: 'Avaliações', rating: 'Nota', creatorEarnings: 'Ganhos do Criador' }, errors: { insufficientCredits: 'Créditos insuficientes.', networkError: 'Erro de rede.', unauthorized: 'Faça login.', notFound: 'Não encontrado.', serverError: 'Erro do servidor.' } },
  nl: { common: { home: 'Home', studios: 'Studios', marketplace: 'Marktplaats', create: 'Maken', publish: 'Publiceren', earn: 'Verdienen', settings: 'Instellingen', profile: 'Profiel', logout: 'Uitloggen', login: 'Inloggen', signup: 'Registreren', save: 'Opslaan', cancel: 'Annuleren', delete: 'Verwijderen', edit: 'Bewerken', loading: 'Laden...', error: 'Fout', success: 'Succes', credits: 'Credits', price: 'Prijs', buy: 'Kopen', sell: 'Verkopen', search: 'Zoeken' }, studios: { book: 'Boek Studio', video: 'Video Studio', music: 'Muziek Studio', course: 'Cursus Maker', image: 'Afbeelding Studio', doctrine: 'Doctrine Engine' }, ai: { generating: 'Genereren...', qualityTier: 'Kwaliteitsniveau', voicePreset: 'Stem Preset', customVoice: 'Aangepaste Stem', draft: 'Concept', standard: 'Standaard', premium: 'Premium', ultra: 'Ultra' }, marketplace: { browse: 'Bladeren', featured: 'Uitgelicht', bestsellers: 'Bestsellers', newReleases: 'Nieuw', categories: 'Categorieën', addToCart: 'In Winkelwagen', checkout: 'Afrekenen', reviews: 'Beoordelingen', rating: 'Beoordeling', creatorEarnings: 'Creator Inkomsten' }, errors: { insufficientCredits: 'Onvoldoende credits.', networkError: 'Netwerkfout.', unauthorized: 'Log in.', notFound: 'Niet gevonden.', serverError: 'Serverfout.' } },
  pl: { common: { home: 'Strona główna', studios: 'Studia', marketplace: 'Rynek', create: 'Utwórz', publish: 'Opublikuj', earn: 'Zarabiaj', settings: 'Ustawienia', profile: 'Profil', logout: 'Wyloguj', login: 'Zaloguj', signup: 'Zarejestruj', save: 'Zapisz', cancel: 'Anuluj', delete: 'Usuń', edit: 'Edytuj', loading: 'Ładowanie...', error: 'Błąd', success: 'Sukces', credits: 'Kredyty', price: 'Cena', buy: 'Kup', sell: 'Sprzedaj', search: 'Szukaj' }, studios: { book: 'Studio Książek', video: 'Studio Wideo', music: 'Studio Muzyki', course: 'Kreator Kursów', image: 'Studio Obrazów', doctrine: 'Silnik Doktryny' }, ai: { generating: 'Generowanie...', qualityTier: 'Poziom Jakości', voicePreset: 'Preset Głosu', customVoice: 'Własny Głos', draft: 'Szkic', standard: 'Standard', premium: 'Premium', ultra: 'Ultra' }, marketplace: { browse: 'Przeglądaj', featured: 'Polecane', bestsellers: 'Bestsellery', newReleases: 'Nowości', categories: 'Kategorie', addToCart: 'Dodaj do koszyka', checkout: 'Kasa', reviews: 'Recenzje', rating: 'Ocena', creatorEarnings: 'Zarobki Twórcy' }, errors: { insufficientCredits: 'Niewystarczające kredyty.', networkError: 'Błąd sieci.', unauthorized: 'Zaloguj się.', notFound: 'Nie znaleziono.', serverError: 'Błąd serwera.' } },
  ru: { common: { home: 'Главная', studios: 'Студии', marketplace: 'Маркет', create: 'Создать', publish: 'Опубликовать', earn: 'Заработать', settings: 'Настройки', profile: 'Профиль', logout: 'Выйти', login: 'Войти', signup: 'Регистрация', save: 'Сохранить', cancel: 'Отмена', delete: 'Удалить', edit: 'Редактировать', loading: 'Загрузка...', error: 'Ошибка', success: 'Успех', credits: 'Кредиты', price: 'Цена', buy: 'Купить', sell: 'Продать', search: 'Поиск' }, studios: { book: 'Книжная Студия', video: 'Видео Студия', music: 'Музыкальная Студия', course: 'Конструктор Курсов', image: 'Студия Изображений', doctrine: 'Доктрина' }, ai: { generating: 'Генерация...', qualityTier: 'Уровень Качества', voicePreset: 'Пресет Голоса', customVoice: 'Свой Голос', draft: 'Черновик', standard: 'Стандарт', premium: 'Премиум', ultra: 'Ультра' }, marketplace: { browse: 'Обзор', featured: 'Рекомендуемое', bestsellers: 'Бестселлеры', newReleases: 'Новинки', categories: 'Категории', addToCart: 'В корзину', checkout: 'Оформить', reviews: 'Отзывы', rating: 'Рейтинг', creatorEarnings: 'Доход Автора' }, errors: { insufficientCredits: 'Недостаточно кредитов.', networkError: 'Ошибка сети.', unauthorized: 'Войдите в систему.', notFound: 'Не найдено.', serverError: 'Ошибка сервера.' } },
  hi: { common: { home: 'होम', studios: 'स्टूडियो', marketplace: 'मार्केट', create: 'बनाएं', publish: 'प्रकाशित करें', earn: 'कमाएं', settings: 'सेटिंग्स', profile: 'प्रोफ़ाइल', logout: 'लॉगआउट', login: 'लॉगिन', signup: 'साइनअप', save: 'सहेजें', cancel: 'रद्द करें', delete: 'हटाएं', edit: 'संपादित करें', loading: 'लोड हो रहा है...', error: 'त्रुटि', success: 'सफलता', credits: 'क्रेडिट', price: 'कीमत', buy: 'खरीदें', sell: 'बेचें', search: 'खोजें' }, studios: { book: 'बुक स्टूडियो', video: 'वीडियो स्टूडियो', music: 'म्यूजिक स्टूडियो', course: 'कोर्स बिल्डर', image: 'इमेज स्टूडियो', doctrine: 'डॉक्ट्रिन इंजन' }, ai: { generating: 'जनरेट हो रहा है...', qualityTier: 'गुणवत्ता स्तर', voicePreset: 'वॉइस प्रीसेट', customVoice: 'कस्टम वॉइस', draft: 'ड्राफ्ट', standard: 'स्टैंडर्ड', premium: 'प्रीमियम', ultra: 'अल्ट्रा' }, marketplace: { browse: 'ब्राउज़ करें', featured: 'फीचर्ड', bestsellers: 'बेस्टसेलर', newReleases: 'नई रिलीज़', categories: 'श्रेणियां', addToCart: 'कार्ट में जोड़ें', checkout: 'चेकआउट', reviews: 'समीक्षाएं', rating: 'रेटिंग', creatorEarnings: 'क्रिएटर आय' }, errors: { insufficientCredits: 'अपर्याप्त क्रेडिट।', networkError: 'नेटवर्क त्रुटि।', unauthorized: 'लॉगिन करें।', notFound: 'नहीं मिला।', serverError: 'सर्वर त्रुटि।' } },
  th: { common: { home: 'หน้าแรก', studios: 'สตูดิโอ', marketplace: 'ตลาด', create: 'สร้าง', publish: 'เผยแพร่', earn: 'รายได้', settings: 'ตั้งค่า', profile: 'โปรไฟล์', logout: 'ออกจากระบบ', login: 'เข้าสู่ระบบ', signup: 'สมัคร', save: 'บันทึก', cancel: 'ยกเลิก', delete: 'ลบ', edit: 'แก้ไข', loading: 'กำลังโหลด...', error: 'ข้อผิดพลาด', success: 'สำเร็จ', credits: 'เครดิต', price: 'ราคา', buy: 'ซื้อ', sell: 'ขาย', search: 'ค้นหา' }, studios: { book: 'สตูดิโอหนังสือ', video: 'สตูดิโอวิดีโอ', music: 'สตูดิโอเพลง', course: 'สร้างคอร์ส', image: 'สตูดิโอภาพ', doctrine: 'Doctrine Engine' }, ai: { generating: 'กำลังสร้าง...', qualityTier: 'ระดับคุณภาพ', voicePreset: 'พรีเซ็ตเสียง', customVoice: 'เสียงที่กำหนดเอง', draft: 'ร่าง', standard: 'มาตรฐาน', premium: 'พรีเมียม', ultra: 'อัลตร้า' }, marketplace: { browse: 'เรียกดู', featured: 'แนะนำ', bestsellers: 'ขายดี', newReleases: 'ใหม่', categories: 'หมวดหมู่', addToCart: 'เพิ่มลงตะกร้า', checkout: 'ชำระเงิน', reviews: 'รีวิว', rating: 'คะแนน', creatorEarnings: 'รายได้ผู้สร้าง' }, errors: { insufficientCredits: 'เครดิตไม่พอ', networkError: 'ข้อผิดพลาดเครือข่าย', unauthorized: 'กรุณาเข้าสู่ระบบ', notFound: 'ไม่พบ', serverError: 'ข้อผิดพลาดเซิร์ฟเวอร์' } },
  vi: { common: { home: 'Trang chủ', studios: 'Studio', marketplace: 'Chợ', create: 'Tạo', publish: 'Xuất bản', earn: 'Kiếm tiền', settings: 'Cài đặt', profile: 'Hồ sơ', logout: 'Đăng xuất', login: 'Đăng nhập', signup: 'Đăng ký', save: 'Lưu', cancel: 'Hủy', delete: 'Xóa', edit: 'Sửa', loading: 'Đang tải...', error: 'Lỗi', success: 'Thành công', credits: 'Tín dụng', price: 'Giá', buy: 'Mua', sell: 'Bán', search: 'Tìm kiếm' }, studios: { book: 'Studio Sách', video: 'Studio Video', music: 'Studio Nhạc', course: 'Tạo Khóa học', image: 'Studio Hình ảnh', doctrine: 'Doctrine Engine' }, ai: { generating: 'Đang tạo...', qualityTier: 'Cấp chất lượng', voicePreset: 'Preset giọng', customVoice: 'Giọng tùy chỉnh', draft: 'Nháp', standard: 'Tiêu chuẩn', premium: 'Cao cấp', ultra: 'Siêu cấp' }, marketplace: { browse: 'Duyệt', featured: 'Nổi bật', bestsellers: 'Bán chạy', newReleases: 'Mới', categories: 'Danh mục', addToCart: 'Thêm vào giỏ', checkout: 'Thanh toán', reviews: 'Đánh giá', rating: 'Xếp hạng', creatorEarnings: 'Thu nhập' }, errors: { insufficientCredits: 'Không đủ tín dụng.', networkError: 'Lỗi mạng.', unauthorized: 'Vui lòng đăng nhập.', notFound: 'Không tìm thấy.', serverError: 'Lỗi máy chủ.' } },
  id: { common: { home: 'Beranda', studios: 'Studio', marketplace: 'Pasar', create: 'Buat', publish: 'Publikasi', earn: 'Hasilkan', settings: 'Pengaturan', profile: 'Profil', logout: 'Keluar', login: 'Masuk', signup: 'Daftar', save: 'Simpan', cancel: 'Batal', delete: 'Hapus', edit: 'Edit', loading: 'Memuat...', error: 'Error', success: 'Sukses', credits: 'Kredit', price: 'Harga', buy: 'Beli', sell: 'Jual', search: 'Cari' }, studios: { book: 'Studio Buku', video: 'Studio Video', music: 'Studio Musik', course: 'Pembuat Kursus', image: 'Studio Gambar', doctrine: 'Doctrine Engine' }, ai: { generating: 'Menghasilkan...', qualityTier: 'Tingkat Kualitas', voicePreset: 'Preset Suara', customVoice: 'Suara Kustom', draft: 'Draf', standard: 'Standar', premium: 'Premium', ultra: 'Ultra' }, marketplace: { browse: 'Jelajahi', featured: 'Unggulan', bestsellers: 'Terlaris', newReleases: 'Terbaru', categories: 'Kategori', addToCart: 'Tambah ke Keranjang', checkout: 'Checkout', reviews: 'Ulasan', rating: 'Rating', creatorEarnings: 'Pendapatan Kreator' }, errors: { insufficientCredits: 'Kredit tidak cukup.', networkError: 'Error jaringan.', unauthorized: 'Silakan masuk.', notFound: 'Tidak ditemukan.', serverError: 'Error server.' } },
  tr: { common: { home: 'Ana Sayfa', studios: 'Stüdyolar', marketplace: 'Pazar', create: 'Oluştur', publish: 'Yayınla', earn: 'Kazan', settings: 'Ayarlar', profile: 'Profil', logout: 'Çıkış', login: 'Giriş', signup: 'Kayıt', save: 'Kaydet', cancel: 'İptal', delete: 'Sil', edit: 'Düzenle', loading: 'Yükleniyor...', error: 'Hata', success: 'Başarılı', credits: 'Kredi', price: 'Fiyat', buy: 'Satın Al', sell: 'Sat', search: 'Ara' }, studios: { book: 'Kitap Stüdyosu', video: 'Video Stüdyosu', music: 'Müzik Stüdyosu', course: 'Kurs Oluşturucu', image: 'Görsel Stüdyosu', doctrine: 'Doktrin Motoru' }, ai: { generating: 'Oluşturuluyor...', qualityTier: 'Kalite Seviyesi', voicePreset: 'Ses Önayarı', customVoice: 'Özel Ses', draft: 'Taslak', standard: 'Standart', premium: 'Premium', ultra: 'Ultra' }, marketplace: { browse: 'Gözat', featured: 'Öne Çıkan', bestsellers: 'En Çok Satanlar', newReleases: 'Yeni', categories: 'Kategoriler', addToCart: 'Sepete Ekle', checkout: 'Ödeme', reviews: 'Yorumlar', rating: 'Puan', creatorEarnings: 'Yaratıcı Kazancı' }, errors: { insufficientCredits: 'Yetersiz kredi.', networkError: 'Ağ hatası.', unauthorized: 'Lütfen giriş yapın.', notFound: 'Bulunamadı.', serverError: 'Sunucu hatası.' } },
  he: { common: { home: 'בית', studios: 'סטודיו', marketplace: 'שוק', create: 'צור', publish: 'פרסם', earn: 'הרוויח', settings: 'הגדרות', profile: 'פרופיל', logout: 'התנתק', login: 'התחבר', signup: 'הרשם', save: 'שמור', cancel: 'בטל', delete: 'מחק', edit: 'ערוך', loading: 'טוען...', error: 'שגיאה', success: 'הצלחה', credits: 'קרדיטים', price: 'מחיר', buy: 'קנה', sell: 'מכור', search: 'חפש' }, studios: { book: 'סטודיו ספרים', video: 'סטודיו וידאו', music: 'סטודיו מוזיקה', course: 'בונה קורסים', image: 'סטודיו תמונות', doctrine: 'מנוע דוקטרינה' }, ai: { generating: 'מייצר...', qualityTier: 'רמת איכות', voicePreset: 'הגדרת קול', customVoice: 'קול מותאם', draft: 'טיוטה', standard: 'רגיל', premium: 'פרימיום', ultra: 'אולטרה' }, marketplace: { browse: 'עיין', featured: 'מומלץ', bestsellers: 'רבי מכר', newReleases: 'חדש', categories: 'קטגוריות', addToCart: 'הוסף לעגלה', checkout: 'תשלום', reviews: 'ביקורות', rating: 'דירוג', creatorEarnings: 'רווחי יוצר' }, errors: { insufficientCredits: 'אין מספיק קרדיטים.', networkError: 'שגיאת רשת.', unauthorized: 'נא להתחבר.', notFound: 'לא נמצא.', serverError: 'שגיאת שרת.' } },
  sv: { common: { home: 'Hem', studios: 'Studior', marketplace: 'Marknadsplats', create: 'Skapa', publish: 'Publicera', earn: 'Tjäna', settings: 'Inställningar', profile: 'Profil', logout: 'Logga ut', login: 'Logga in', signup: 'Registrera', save: 'Spara', cancel: 'Avbryt', delete: 'Radera', edit: 'Redigera', loading: 'Laddar...', error: 'Fel', success: 'Lyckades', credits: 'Krediter', price: 'Pris', buy: 'Köp', sell: 'Sälj', search: 'Sök' }, studios: { book: 'Bokstudio', video: 'Videostudio', music: 'Musikstudio', course: 'Kursbyggare', image: 'Bildstudio', doctrine: 'Doktrinmotor' }, ai: { generating: 'Genererar...', qualityTier: 'Kvalitetsnivå', voicePreset: 'Röstförinställning', customVoice: 'Anpassad röst', draft: 'Utkast', standard: 'Standard', premium: 'Premium', ultra: 'Ultra' }, marketplace: { browse: 'Bläddra', featured: 'Utvalda', bestsellers: 'Bästsäljare', newReleases: 'Nyheter', categories: 'Kategorier', addToCart: 'Lägg i kundvagn', checkout: 'Kassa', reviews: 'Recensioner', rating: 'Betyg', creatorEarnings: 'Skaparens intäkter' }, errors: { insufficientCredits: 'Otillräckliga krediter.', networkError: 'Nätverksfel.', unauthorized: 'Vänligen logga in.', notFound: 'Hittades inte.', serverError: 'Serverfel.' } },
};

export function getTranslation(locale: SupportedLocale): TranslationKeys {
  return translations[locale] || translations.en;
}

export function t(locale: SupportedLocale, path: string): string {
  const keys = path.split('.');
  let result: any = translations[locale] || translations.en;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      const fallback: any = translations.en;
      let fallbackResult = fallback;
      for (const k of keys) {
        if (fallbackResult && typeof fallbackResult === 'object' && k in fallbackResult) {
          fallbackResult = fallbackResult[k];
        } else {
          return path;
        }
      }
      return typeof fallbackResult === 'string' ? fallbackResult : path;
    }
  }
  
  return typeof result === 'string' ? result : path;
}

export function detectLocaleFromHeader(acceptLanguage: string | undefined): SupportedLocale {
  if (!acceptLanguage) return 'en';
  
  const preferred = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
  
  if (preferred in translations) {
    return preferred as SupportedLocale;
  }
  
  return 'en';
}
