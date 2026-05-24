# AgroMapa Pro — PWA de Mapeamento de Pragas

App para mapeamento de pragas em silvicultura.  
Funciona **100% offline** — ideal para áreas rurais sem cobertura de internet.

---

## Funcionalidades

- 📍 **GPS** com rastreamento em tempo real e indicador de precisão
- 🗺️ **Mapa interativo** com marcadores coloridos por severidade
- 🌳 **Talhões** — desenhe polígonos para delimitar parcelas (calcula área em ha)
- 📷 **Foto** da praga diretamente pela câmera do celular
- 🐜 **19 pragas** pré-cadastradas para silvicultura + pragas personalizadas
- 📊 **Exportação** em CSV, GeoJSON (QGIS), JSON (backup) e Relatório TXT
- ⚡ **Offline-first** — Service Worker cacheia o app e tiles do mapa
- 💾 **Dados locais** — tudo salvo no dispositivo, sem servidor necessário

---

## Como hospedar e instalar

### Opção 1: Netlify Drop (mais fácil, grátis)

1. Acesse **https://app.netlify.com/drop**
2. Arraste a pasta `agromapa-pwa` inteira para a área indicada
3. O Netlify gera uma URL automática (ex: `https://meuapp.netlify.app`)
4. Acesse essa URL no celular → aparece banner "Adicionar à tela inicial"

### Opção 2: GitHub Pages (grátis)

```bash
# No terminal, dentro da pasta agromapa-pwa:
git init
git add .
git commit -m "AgroMapa Pro PWA"
# Crie um repositório no GitHub e faça push
# Ative GitHub Pages nas configurações do repositório
```

### Opção 3: Servidor local na fazenda (rede Wi-Fi)

Se quiser usar numa rede local (ex: roteador da fazenda):

```bash
# Instale o Node.js, depois:
npx serve agromapa-pwa -p 3000

# Acesse de qualquer celular na mesma rede Wi-Fi:
# http://192.168.1.X:3000
```

> **Importante:** Para o PWA funcionar (instalação + Service Worker),
> o servidor precisa servir via **HTTPS** — o Netlify e GitHub Pages fazem isso automaticamente.

---

## Instalando no celular

### Android (Chrome)
1. Acesse a URL do app no Chrome
2. Toque no banner "Instalar" que aparece automaticamente
3. Ou: menu ⋮ → "Adicionar à tela inicial"
4. O app instala como um app nativo

### iPhone / iPad (Safari)
1. Acesse a URL no Safari
2. Toque no botão de compartilhar ⬆
3. Role e selecione "Adicionar à Tela de Início"
4. Confirme o nome e toque "Adicionar"

---

## Arquivos do projeto

```
agromapa-pwa/
├── index.html      # App completo (HTML + CSS + JS)
├── sw.js           # Service Worker (offline + cache de tiles)
├── manifest.json   # Configuração PWA (ícones, nome, cores)
├── icons/
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-192.png  ← Ícone principal
│   └── icon-512.png  ← Para splash screen
└── README.md
```

---

## Cache offline — como funciona

O Service Worker (`sw.js`) usa uma estratégia em 3 camadas:

1. **App** — arquivos HTML/CSS/JS cacheados na instalação. Sempre disponíveis.
2. **Tiles do mapa** — cada quadrante do mapa visitado é salvo automaticamente.
   Quando o técnico percorre uma área com sinal, os tiles são cacheados.
   Na próxima visita sem sinal, o mapa já aparece.
3. **Dados** — registros, talhões e fotos ficam no `localStorage` do dispositivo.

---

## Exportação dos dados

| Formato | Uso |
|---------|-----|
| **CSV** | Excel, Google Sheets, qualquer planilha |
| **GeoJSON** | QGIS, ArcGIS, Google Earth Pro |
| **JSON** | Backup completo (inclui fotos comprimidas) |
| **TXT** | Relatório para impressão ou e-mail |

---

## Pragas cadastradas

| Categoria | Pragas |
|-----------|--------|
| Formigas | Cortadeira (*Atta*), Quem-quem (*Acromyrmex*), Saúva (*A. laevigata*) |
| Lagartas | Lonomia, Lagarta-do-cartucho, Medideira |
| Besouros | Besouro Brocador, Broca-do-eucalipto |
| Percevejos | Psilídeo, Percevejo Bronzeado, Percevejo Marrom |
| Fungos | Armilária, Ferrugem, Cancro do Eucalipto |
| Outros | Vespa da Madeira, Pulgão, Cochonilha, Erinose |

Novas pragas podem ser adicionadas pelo app (ficam salvas no dispositivo).
