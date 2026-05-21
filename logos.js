// Curated brand pool — confirmed on logo.dev
const LOGO_POOL = [

  // ── Tech ──────────────────────────────────────────────────────────────────
  { domain: 'apple.com',        name: 'Apple',           cat: 'Tech'         },
  { domain: 'google.com',       name: 'Google',          cat: 'Tech'         },
  { domain: 'microsoft.com',    name: 'Microsoft',       cat: 'Tech'         },
  { domain: 'amazon.com',       name: 'Amazon',          cat: 'Tech'         },
  { domain: 'samsung.com',      name: 'Samsung',         cat: 'Tech'         },
  { domain: 'intel.com',        name: 'Intel',           cat: 'Tech'         },
  { domain: 'nvidia.com',       name: 'Nvidia',          cat: 'Tech'         },
  { domain: 'ibm.com',          name: 'IBM',             cat: 'Tech'         },
  { domain: 'sony.com',         name: 'Sony',            cat: 'Tech'         },
  { domain: 'lg.com',           name: 'LG',              cat: 'Tech'         },

  // ── Social / Comms ────────────────────────────────────────────────────────
  { domain: 'meta.com',         name: 'Meta',            cat: 'Social'       },
  { domain: 'twitter.com',      name: 'X (Twitter)',     cat: 'Social'       },
  { domain: 'linkedin.com',     name: 'LinkedIn',        cat: 'Social'       },
  { domain: 'snapchat.com',     name: 'Snapchat',        cat: 'Social'       },
  { domain: 'tiktok.com',       name: 'TikTok',          cat: 'Social'       },
  { domain: 'pinterest.com',    name: 'Pinterest',       cat: 'Social'       },
  { domain: 'reddit.com',       name: 'Reddit',          cat: 'Social'       },
  { domain: 'discord.com',      name: 'Discord',         cat: 'Social'       },
  { domain: 'whatsapp.com',     name: 'WhatsApp',        cat: 'Social'       },

  // ── Media / Entertainment ─────────────────────────────────────────────────
  { domain: 'netflix.com',      name: 'Netflix',         cat: 'Media'        },
  { domain: 'spotify.com',      name: 'Spotify',         cat: 'Media'        },
  { domain: 'youtube.com',      name: 'YouTube',         cat: 'Media'        },
  { domain: 'twitch.tv',        name: 'Twitch',          cat: 'Media'        },
  { domain: 'disney.com',       name: 'Disney',          cat: 'Media'        },

  // ── SaaS / Productivity ───────────────────────────────────────────────────
  { domain: 'slack.com',        name: 'Slack',           cat: 'SaaS'         },
  { domain: 'zoom.us',          name: 'Zoom',            cat: 'SaaS'         },
  { domain: 'figma.com',        name: 'Figma',           cat: 'SaaS'         },
  { domain: 'notion.so',        name: 'Notion',          cat: 'SaaS'         },
  { domain: 'dropbox.com',      name: 'Dropbox',         cat: 'SaaS'         },
  { domain: 'shopify.com',      name: 'Shopify',         cat: 'SaaS'         },
  { domain: 'stripe.com',       name: 'Stripe',          cat: 'SaaS'         },
  { domain: 'github.com',       name: 'GitHub',          cat: 'SaaS'         },
  { domain: 'atlassian.com',    name: 'Atlassian',       cat: 'SaaS'         },
  { domain: 'salesforce.com',   name: 'Salesforce',      cat: 'SaaS'         },
  { domain: 'adobe.com',        name: 'Adobe',           cat: 'SaaS'         },

  // ── Finance ───────────────────────────────────────────────────────────────
  { domain: 'paypal.com',       name: 'PayPal',          cat: 'Finance'      },
  { domain: 'visa.com',         name: 'Visa',            cat: 'Finance'      },
  { domain: 'mastercard.com',   name: 'Mastercard',      cat: 'Finance'      },
  { domain: 'ebay.com',         name: 'eBay',            cat: 'Finance'      },
  { domain: 'amex.com',         name: 'Amex',            cat: 'Finance'      },

  // ── Automotive ────────────────────────────────────────────────────────────
  { domain: 'tesla.com',        name: 'Tesla',           cat: 'Auto'         },
  { domain: 'bmw.com',          name: 'BMW',             cat: 'Auto'         },
  { domain: 'toyota.com',       name: 'Toyota',          cat: 'Auto'         },
  { domain: 'volkswagen.com',   name: 'Volkswagen',      cat: 'Auto'         },
  { domain: 'ford.com',         name: 'Ford',            cat: 'Auto'         },
  { domain: 'mercedes-benz.com',name: 'Mercedes-Benz',   cat: 'Auto'         },
  { domain: 'audi.com',         name: 'Audi',            cat: 'Auto'         },
  { domain: 'porsche.com',      name: 'Porsche',         cat: 'Auto'         },
  { domain: 'honda.com',        name: 'Honda',           cat: 'Auto'         },
  { domain: 'hyundai.com',      name: 'Hyundai',         cat: 'Auto'         },
  { domain: 'ferrari.com',      name: 'Ferrari',         cat: 'Auto'         },
  { domain: 'volvo.com',        name: 'Volvo',           cat: 'Auto'         },
  { domain: 'renault.com',      name: 'Renault',         cat: 'Auto'         },
  { domain: 'kia.com',          name: 'Kia',             cat: 'Auto'         },
  { domain: 'landrover.com',    name: 'Land Rover',      cat: 'Auto'         },
  { domain: 'peugeot.com',      name: 'Peugeot',         cat: 'Auto'         },
  { domain: 'fiat.com',         name: 'Fiat',            cat: 'Auto'         },
  { domain: 'lamborghini.com',  name: 'Lamborghini',     cat: 'Auto'         },

  // ── Clothing & Fashion ────────────────────────────────────────────────────
  { domain: 'nike.com',         name: 'Nike',            cat: 'Fashion'      },
  { domain: 'adidas.com',       name: 'Adidas',          cat: 'Fashion'      },
  { domain: 'zara.com',         name: 'Zara',            cat: 'Fashion'      },
  { domain: 'hm.com',           name: 'H&M',             cat: 'Fashion'      },
  { domain: 'uniqlo.com',       name: 'Uniqlo',          cat: 'Fashion'      },
  { domain: 'gucci.com',        name: 'Gucci',           cat: 'Fashion'      },
  { domain: 'louisvuitton.com', name: 'Louis Vuitton',   cat: 'Fashion'      },
  { domain: 'burberry.com',     name: 'Burberry',        cat: 'Fashion'      },
  { domain: 'ralphlauren.com',  name: 'Ralph Lauren',    cat: 'Fashion'      },
  { domain: 'levis.com',        name: "Levi's",          cat: 'Fashion'      },
  { domain: 'prada.com',        name: 'Prada',           cat: 'Fashion'      },
  { domain: 'chanel.com',       name: 'Chanel',          cat: 'Fashion'      },
  { domain: 'tommyhilfiger.com',name: 'Tommy Hilfiger',  cat: 'Fashion'      },
  { domain: 'calvinklein.com',  name: 'Calvin Klein',    cat: 'Fashion'      },
  { domain: 'gap.com',          name: 'Gap',             cat: 'Fashion'      },
  { domain: 'underarmour.com',  name: 'Under Armour',    cat: 'Fashion'      },

  // ── US Supermarkets ───────────────────────────────────────────────────────
  { domain: 'walmart.com',      name: 'Walmart',         cat: 'Supermarket'  },
  { domain: 'target.com',       name: 'Target',          cat: 'Supermarket'  },
  { domain: 'costco.com',       name: 'Costco',          cat: 'Supermarket'  },
  { domain: 'kroger.com',       name: 'Kroger',          cat: 'Supermarket'  },
  { domain: 'wholefoodsmarket.com', name: 'Whole Foods', cat: 'Supermarket'  },
  { domain: 'traderjoes.com',   name: "Trader Joe's",    cat: 'Supermarket'  },
  { domain: 'instacart.com',    name: 'Instacart',       cat: 'Supermarket'  },

  // ── UK / EU Supermarkets ──────────────────────────────────────────────────
  { domain: 'tesco.com',        name: 'Tesco',           cat: 'Supermarket'  },
  { domain: 'sainsburys.co.uk', name: "Sainsbury's",     cat: 'Supermarket'  },
  { domain: 'asda.com',         name: 'ASDA',            cat: 'Supermarket'  },
  { domain: 'marksandspencer.com', name: 'M&S',          cat: 'Supermarket'  },
  { domain: 'waitrose.com',     name: 'Waitrose',        cat: 'Supermarket'  },
  { domain: 'lidl.com',         name: 'Lidl',            cat: 'Supermarket'  },
  { domain: 'aldi.com',         name: 'Aldi',            cat: 'Supermarket'  },
  { domain: 'carrefour.com',    name: 'Carrefour',       cat: 'Supermarket'  },
  { domain: 'edeka.de',         name: 'Edeka',           cat: 'Supermarket'  },

  // ── Food & Drink ──────────────────────────────────────────────────────────
  { domain: 'mcdonalds.com',    name: "McDonald's",      cat: 'Food'         },
  { domain: 'starbucks.com',    name: 'Starbucks',       cat: 'Food'         },
  { domain: 'coca-cola.com',    name: 'Coca-Cola',       cat: 'Food'         },
  { domain: 'pepsi.com',        name: 'Pepsi',           cat: 'Food'         },
  { domain: 'kfc.com',          name: 'KFC',             cat: 'Food'         },
  { domain: 'subway.com',       name: 'Subway',          cat: 'Food'         },
  { domain: 'pizzahut.com',     name: 'Pizza Hut',       cat: 'Food'         },
  { domain: 'dominos.com',      name: "Domino's",        cat: 'Food'         },
  { domain: 'burgerking.com',   name: 'Burger King',     cat: 'Food'         },

  // ── Retail / Consumer ─────────────────────────────────────────────────────
  { domain: 'ikea.com',         name: 'IKEA',            cat: 'Retail'       },
  { domain: 'lego.com',         name: 'LEGO',            cat: 'Retail'       },
  { domain: 'dyson.com',        name: 'Dyson',           cat: 'Retail'       },

  // ── Travel ────────────────────────────────────────────────────────────────
  { domain: 'airbnb.com',       name: 'Airbnb',          cat: 'Travel'       },
  { domain: 'uber.com',         name: 'Uber',            cat: 'Travel'       },
  { domain: 'booking.com',      name: 'Booking.com',     cat: 'Travel'       },
]
