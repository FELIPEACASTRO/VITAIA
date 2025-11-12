# VITAIA Design System

## 🎨 Identidade Visual

**Nome:** VITAIA  
**Tagline:** A IA da Vida - Inteligência Artificial Médica  
**Conceito:** Vita (Vida em Latim) + AI (Inteligência Artificial)  
**Sensação:** Simples, global, impactante e fácil de lembrar

---

## 🎯 Paleta de Cores

### Cores Primárias

| Cor               | Hex       | RGB          | Uso                                  |
| ----------------- | --------- | ------------ | ------------------------------------ |
| **Azul Profundo** | `#0F172A` | 15, 23, 42   | Background principal, textos escuros |
| **Verde Vivo**    | `#10B981` | 16, 185, 129 | Ações positivas, sucesso, aprovação  |
| **Azul Ciano**    | `#06B6D4` | 6, 182, 212  | Informações, destaques, links        |
| **Roxo Moderno**  | `#8B5CF6` | 139, 92, 246 | Elementos de IA, gradientes          |

### Cores Secundárias

| Cor                 | Hex       | RGB           | Uso                         |
| ------------------- | --------- | ------------- | --------------------------- |
| **Vermelho Alerta** | `#EF4444` | 239, 68, 68   | Erros, avisos críticos      |
| **Âmbar Aviso**     | `#F59E0B` | 245, 158, 11  | Avisos, atenção             |
| **Cinza Neutro**    | `#6B7280` | 107, 114, 128 | Textos secundários, borders |
| **Branco Puro**     | `#FFFFFF` | 255, 255, 255 | Backgrounds claros, textos  |

### Gradientes Signature

```css
/* Gradiente Verde-Ciano (Vida + Tecnologia) */
background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);

/* Gradiente Roxo-Azul (IA Avançada) */
background: linear-gradient(135deg, #8b5cf6 0%, #0f172a 100%);

/* Gradiente Dinâmico (Energia) */
background: linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%);
```

---

## 🔤 Tipografia

### Fontes

| Tipo            | Fonte                | Uso                    |
| --------------- | -------------------- | ---------------------- |
| **Headlines**   | Inter Bold (700)     | Títulos, H1, H2        |
| **Subheadings** | Inter SemiBold (600) | Subtítulos, H3, H4     |
| **Body**        | Inter Regular (400)  | Textos, parágrafos     |
| **Code**        | JetBrains Mono       | Código, dados técnicos |

### Escalas Tipográficas

| Tamanho        | Peso       | Uso                |
| -------------- | ---------- | ------------------ |
| **H1**         | 48px / 700 | Títulos principais |
| **H2**         | 36px / 600 | Títulos de seção   |
| **H3**         | 28px / 600 | Subtítulos         |
| **H4**         | 24px / 600 | Cabeçalhos de card |
| **Body Large** | 18px / 400 | Textos importantes |
| **Body**       | 16px / 400 | Textos padrão      |
| **Body Small** | 14px / 400 | Textos secundários |
| **Caption**    | 12px / 500 | Labels, badges     |

---

## 🎨 Componentes UI

### Botões

**Primário (Verde Vivo)**

```
Cor: #10B981
Hover: #059669
Ativo: #047857
Padding: 12px 24px
Border Radius: 8px
```

**Secundário (Azul Ciano)**

```
Cor: #06B6D4
Hover: #0891B2
Ativo: #0E7490
Padding: 12px 24px
Border Radius: 8px
```

**Terciário (Roxo)**

```
Cor: #8B5CF6
Hover: #7C3AED
Ativo: #6D28D9
Padding: 12px 24px
Border Radius: 8px
```

### Cards

```css
Background: #FFFFFF
Border: 1px solid #E5E7EB
Border Radius: 12px
Box Shadow: 0 4px 6px rgba(0, 0, 0, 0.07)
Padding: 24px
Transition: all 0.3s ease
Hover Shadow: 0 12px 24px rgba(0, 0, 0, 0.12)
```

### Inputs

```css
Background: #F3F4F6
Border: 1px solid #D1D5DB
Border Radius: 8px
Padding: 12px 16px
Font Size: 16px
Focus Border: 2px solid #06B6D4
Focus Background: #FFFFFF
```

### Badges

**Sucesso (Verde)**

```
Background: #D1FAE5
Color: #065F46
```

**Aviso (Âmbar)**

```
Background: #FEF3C7
Color: #92400E
```

**Erro (Vermelho)**

```
Background: #FEE2E2
Color: #7F1D1D
```

**Info (Azul)**

```
Background: #DBEAFE
Color: #1E40AF
```

---

## 📐 Espaçamento

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

---

## 🎭 Efeitos e Animações

### Transições

```css
/* Padrão */
transition: all 0.3s ease;

/* Rápida */
transition: all 0.15s ease;

/* Lenta */
transition: all 0.5s ease;
```

### Sombras

```css
/* Elevação 1 */
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Elevação 2 */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Elevação 3 */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Elevação 4 */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Animações

```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Slide Up */
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Pulse (IA Ativa) */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

---

## 📱 Responsividade

```
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: > 1024px
```

---

## 🔐 Acessibilidade

- Contraste mínimo WCAG AA (4.5:1 para textos)
- Foco visível em todos os elementos interativos
- Suporte a navegação por teclado
- Labels descritivos para inputs
- ARIA labels onde necessário

---

## 🎯 Padrões de Uso

### Página de Login

- Fundo com gradiente roxo-azul
- Logo VITAIA centralizado
- Formulário minimalista
- Botão primário verde

### Dashboard

- Sidebar escura com logo
- Cards com dados do paciente
- Gráficos com cores primárias
- Notificações em tempo real

### Consulta/Paciente

- Header com informações do paciente
- Tabs para diferentes seções
- Painel de IA com destaque roxo
- Botões de ação em verde

### Análise de Imagem

- Preview da imagem em destaque
- Loading animation com pulse roxo
- Resultado com badge de confiança
- Recomendações em cards

---

## 🚀 Implementação CSS

```css
/* Root Colors */
:root {
  --color-primary: #10b981;
  --color-primary-dark: #059669;
  --color-secondary: #06b6d4;
  --color-tertiary: #8b5cf6;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  --color-success: #10b981;
  --color-info: #06b6d4;
  --color-neutral: #6b7280;
  --color-bg-dark: #0f172a;
  --color-bg-light: #ffffff;
  --color-border: #e5e7eb;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  --transition-fast: all 0.15s ease;
  --transition-normal: all 0.3s ease;
  --transition-slow: all 0.5s ease;
}
```

---

## 📊 Componentes Específicos Médicos

### Status do Paciente

- Verde: Estável
- Âmbar: Atenção
- Vermelho: Crítico

### Confiança de IA

- Verde: > 80%
- Âmbar: 60-80%
- Vermelho: < 60%

### Prioridade de Consulta

- Verde: Baixa
- Âmbar: Média
- Vermelho: Alta

---

## 🎬 Animações de Carregamento

### Skeleton Loading

```
Cor: #E5E7EB
Animação: Shimmer de esquerda para direita
Duração: 2s
```

### Loading Spinner

```
Cor: Gradiente roxo-azul
Tamanho: 40px
Animação: Rotação contínua
```

### AI Processing

```
Cor: Roxo com pulse
Animação: Pulse suave
Duração: 1.5s
```

---

## 📈 Temas Suportados

### Dark Mode (Padrão)

- Background: #0F172A
- Texto: #FFFFFF
- Cards: #1E293B

### Light Mode

- Background: #FFFFFF
- Texto: #0F172A
- Cards: #F8FAFC

---

## 🔄 Consistência Visual

Todos os componentes devem seguir:

1. Paleta de cores definida
2. Tipografia padronizada
3. Espaçamento consistente
4. Sombras apropriadas
5. Transições suaves
6. Acessibilidade garantida
