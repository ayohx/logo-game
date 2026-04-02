// Curated pool of 50 well-known brands confirmed on logo.dev
// Each entry: { domain, name, category }
const LOGO_POOL = [
  // Tech
  { domain: 'apple.com',       name: 'Apple',          cat: 'Tech'    },
  { domain: 'google.com',      name: 'Google',         cat: 'Tech'    },
  { domain: 'microsoft.com',   name: 'Microsoft',      cat: 'Tech'    },
  { domain: 'amazon.com',      name: 'Amazon',         cat: 'Tech'    },
  { domain: 'samsung.com',     name: 'Samsung',        cat: 'Tech'    },
  { domain: 'intel.com',       name: 'Intel',          cat: 'Tech'    },
  { domain: 'nvidia.com',      name: 'Nvidia',         cat: 'Tech'    },
  { domain: 'ibm.com',         name: 'IBM',            cat: 'Tech'    },

  // Social / Comms
  { domain: 'meta.com',        name: 'Meta',           cat: 'Social'  },
  { domain: 'twitter.com',     name: 'X (Twitter)',    cat: 'Social'  },
  { domain: 'linkedin.com',    name: 'LinkedIn',       cat: 'Social'  },
  { domain: 'snapchat.com',    name: 'Snapchat',       cat: 'Social'  },
  { domain: 'tiktok.com',      name: 'TikTok',         cat: 'Social'  },
  { domain: 'pinterest.com',   name: 'Pinterest',      cat: 'Social'  },
  { domain: 'reddit.com',      name: 'Reddit',         cat: 'Social'  },
  { domain: 'discord.com',     name: 'Discord',        cat: 'Social'  },
  { domain: 'whatsapp.com',    name: 'WhatsApp',       cat: 'Social'  },

  // Media / Entertainment
  { domain: 'netflix.com',     name: 'Netflix',        cat: 'Media'   },
  { domain: 'spotify.com',     name: 'Spotify',        cat: 'Media'   },
  { domain: 'youtube.com',     name: 'YouTube',        cat: 'Media'   },
  { domain: 'twitch.tv',       name: 'Twitch',         cat: 'Media'   },
  { domain: 'disney.com',      name: 'Disney',         cat: 'Media'   },

  // SaaS / Productivity
  { domain: 'slack.com',       name: 'Slack',          cat: 'SaaS'    },
  { domain: 'zoom.us',         name: 'Zoom',           cat: 'SaaS'    },
  { domain: 'figma.com',       name: 'Figma',          cat: 'SaaS'    },
  { domain: 'notion.so',       name: 'Notion',         cat: 'SaaS'    },
  { domain: 'dropbox.com',     name: 'Dropbox',        cat: 'SaaS'    },
  { domain: 'shopify.com',     name: 'Shopify',        cat: 'SaaS'    },
  { domain: 'stripe.com',      name: 'Stripe',         cat: 'SaaS'    },
  { domain: 'github.com',      name: 'GitHub',         cat: 'SaaS'    },
  { domain: 'atlassian.com',   name: 'Atlassian',      cat: 'SaaS'    },
  { domain: 'salesforce.com',  name: 'Salesforce',     cat: 'SaaS'    },
  { domain: 'adobe.com',       name: 'Adobe',          cat: 'SaaS'    },

  // Finance
  { domain: 'paypal.com',      name: 'PayPal',         cat: 'Finance' },
  { domain: 'visa.com',        name: 'Visa',           cat: 'Finance' },
  { domain: 'mastercard.com',  name: 'Mastercard',     cat: 'Finance' },
  { domain: 'ebay.com',        name: 'eBay',           cat: 'Finance' },

  // Retail / Consumer
  { domain: 'nike.com',        name: 'Nike',           cat: 'Retail'  },
  { domain: 'adidas.com',      name: 'Adidas',         cat: 'Retail'  },
  { domain: 'ikea.com',        name: 'IKEA',           cat: 'Retail'  },
  { domain: 'lego.com',        name: 'LEGO',           cat: 'Retail'  },

  // Food & Drink
  { domain: 'mcdonalds.com',   name: "McDonald's",     cat: 'Food'    },
  { domain: 'starbucks.com',   name: 'Starbucks',      cat: 'Food'    },
  { domain: 'coca-cola.com',   name: 'Coca-Cola',      cat: 'Food'    },
  { domain: 'pepsi.com',       name: 'Pepsi',          cat: 'Food'    },

  // Automotive
  { domain: 'tesla.com',       name: 'Tesla',          cat: 'Auto'    },
  { domain: 'bmw.com',         name: 'BMW',            cat: 'Auto'    },
  { domain: 'toyota.com',      name: 'Toyota',         cat: 'Auto'    },
  { domain: 'volkswagen.com',  name: 'Volkswagen',     cat: 'Auto'    },

  // Travel
  { domain: 'airbnb.com',      name: 'Airbnb',         cat: 'Travel'  },
  { domain: 'uber.com',        name: 'Uber',           cat: 'Travel'  },
  { domain: 'booking.com',     name: 'Booking.com',    cat: 'Travel'  },
]
