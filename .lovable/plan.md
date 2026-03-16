
# Ouro & Brasa — Cardápio Digital

## Visão Geral
Aplicativo web de cardápio digital para restaurantes com página pública para clientes e painel administrativo para o dono. Pedidos são enviados via WhatsApp.

## Banco de Dados (Supabase / Lovable Cloud)

### Tabelas
- **categories** — id, name, sort_order
- **menu_items** — id, category_id (FK), name, description, price, image_url, is_available, created_at
- **restaurant_config** — id, name, whatsapp_number, logo_url, description
- **user_roles** — id, user_id (FK auth.users), role (enum: admin/user)

### Storage
- Bucket `menu-images` (público) para fotos dos itens

### RLS
- Leitura pública em categories, menu_items e restaurant_config
- Escrita restrita a admins via função `has_role()`

## Página Pública (`/`)

### Cabeçalho
- Logo + nome do restaurante + descrição curta (dados de `restaurant_config`)
- Sticky category bar com scroll horizontal

### Cardápio
- Itens agrupados por categoria, scroll vertical
- Cards com foto (aspect-square, rounded-2xl), nome, descrição curta, preço (badge laranja)
- Botão "Adicionar ao Pedido" com feedback tátil (scale 0.97)
- Só exibe itens com `is_available = true`

### Carrinho (Drawer lateral)
- Lista de itens com quantidade editável (+/-)
- Total calculado em tempo real
- Campos: Nome e Endereço do cliente
- Botão "Finalizar no WhatsApp" (laranja, destaque) → abre `wa.me` com mensagem formatada
- Ícone flutuante do carrinho com badge de quantidade

## Painel Admin (`/admin`)

### Login (`/admin/login`)
- Email + senha via Supabase Auth
- Rota protegida — redireciona se não autenticado

### Dashboard
- Lista densa de itens do cardápio com toggle "Disponível/Indisponível"
- Botões de editar e excluir por item
- Filtro por categoria

### CRUD de Itens
- Modal/formulário: nome, descrição, preço, categoria (select), foto (upload para bucket)
- Validação com zod

### Gerenciar Categorias
- Criar, editar, reordenar e excluir categorias

### Configurações
- Editar nome do restaurante, descrição, logo e número do WhatsApp

## Design
- **Mobile-first**, container max-w-md centralizado
- **Cores**: fundo #FAFAFA, texto escuro, laranja #F26110 para CTAs
- **Fontes**: Outfit (títulos) + Plus Jakarta Sans (corpo)
- **Motion**: transições suaves, drawer animado, stagger nos itens do menu
- **Skeleton screens** durante carregamento

## Páginas/Rotas
- `/` — Cardápio público
- `/admin/login` — Login do admin
- `/admin` — Dashboard administrativo
