# Skills: sitio web 3D inmersivo

Set de skills de Claude Code para construir sitios web inmersivos con WebGL, al estilo
de estudios como [alche.jp](https://alche.jp).

## Contenido

| Skill | Para qué |
|---|---|
| `3d-site-workflow` | Proceso de 4 fases: dirección → sistema visual → build → entrega |
| `webgl-hero` | Escena principal en Three.js, shaders, esfera distorsionada, cursor |
| `scroll-choreography` | Lenis + GSAP ScrollTrigger, pinning, scrub, scroll → shader |
| `displaced-typography` | Titulares con distorsión, refracción y aberración cromática |
| `project-media-grid` | Grilla de proyectos con video en hover, filtros, lazy loading |
| `page-transitions` | View Transitions API y barba.js, preservando el contexto WebGL |
| `webgl-performance` | Presupuesto, degradación por dispositivo, fugas, perfilado |

## Instalación

Claude Code descubre las skills en `.claude/skills/` del directorio desde el que se
ejecuta. Este repo ya trae la estructura hecha en `web/.claude/skills/`.

### En tu bóveda de Obsidian (PowerShell)

Desde la carpeta `web` de tu vault:

```powershell
# 1. Clonar el repo en una carpeta temporal
git clone -b claude/obsidian-skills-install-w2lmyt https://github.com/myleadsai/website.git $env:TEMP\ml-website

# 2. Copiar las skills a la carpeta web de tu vault
$vault = "C:\ruta\a\tu\Vault\web"        # <-- ajusta esta ruta
New-Item -ItemType Directory -Force -Path "$vault\.claude\skills" | Out-Null
Copy-Item "$env:TEMP\ml-website\web\.claude\skills\*" "$vault\.claude\skills\" -Recurse -Force

# 3. Verificar
Get-ChildItem "$vault\.claude\skills"
```

### Uso

Abre Claude Code en esa carpeta y las skills quedan disponibles:

```powershell
cd C:\ruta\a\tu\Vault\web
claude
```

Dentro de la sesión, `/skills` lista las disponibles. Claude las activa solo cuando la
tarea coincide con su `description`, o puedes invocarlas por nombre.

## Nota sobre Obsidian

Obsidian no tiene un concepto de "skills" — tiene plugins de comunidad, que se instalan
desde *Settings → Community plugins*. Estas son skills de **Claude Code**, y funcionan
porque ejecutas Claude Code dentro de la carpeta del vault. Los archivos son markdown
normal, así que también se leen bien desde Obsidian como notas de referencia.
