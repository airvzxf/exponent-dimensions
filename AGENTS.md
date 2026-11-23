# exponent-dimensions — instrucciones para agentes

Reglas del proyecto para cualquier agente automatizado o mantenedor. La
forma sigue el `AGENTS.md` de `airvzxf/ftp-deployment-action` y
`airvzxf/moagan`; lo de abajo es propio de este repositorio.

## Proyecto

| Campo | Valor |
|---|---|
| Repo | https://github.com/airvzxf/exponent-dimensions |
| Tipo | Sitio estático, sin paso de compilación |
| Publicación | Cloudflare **Pages** (proyecto `exponent-dimensions`), conectado a GitHub |
| Producción | https://exponent-dimensions.rovisoft.net/ — cada push a `main` |
| Vistas previas | Cada rama y PR genera una URL `*.exponent-dimensions.pages.dev` |
| Carpeta publicada | `src/` |
| Licencia | AGPL-3.0 |

Nada se publica en registros de paquetes. La "release" es un tag firmado
y su página de GitHub Release con el zip de `src/`.

## Stack

- HTML, CSS y JavaScript con módulos ES, sin dependencias npm en `src/`.
- Three.js se carga desde jsDelivr con un import map y hashes SRI.
  Al subir de versión hay que actualizar las URL y los tres hashes
  (`three.module.js`, `three.core.js`, `OrbitControls.js`) en
  `src/index.html`:
  `curl -s <url> | openssl dgst -sha384 -binary | base64 -w0`.
- `tests/` tiene la única dependencia npm (`puppeteer-core`) para la
  prueba de humo. No crear `package.json` en la raíz: Cloudflare Pages lo
  instalaría en cada despliegue.

## Convenciones

- Interfaz, comentarios, README y CHANGELOG en español. Los textos de la
  interfaz viven en `src/i18n.js` (español e inglés).
- Commits convencionales en inglés: `feat`, `fix`, `refactor`, `docs`,
  `test`, `chore`, `ci`, `build`, `perf`. Un cambio lógico por commit.
- Commits y tags firmados (SSH). Sin `--amend` sobre commits publicados,
  sin `push --force`, sin `--no-gpg-sign`.
- Acciones de terceros fijadas por SHA de commit con la versión como
  comentario (`uses: owner/action@<40-hex> # vX.Y.Z`).

## Validación

| Nivel | Dónde | Qué |
|---|---|---|
| Local | `make check` | html-validate, sintaxis JS, actionlint (si está instalado) y prueba de humo |
| PR / main | `ci.yml` | lo mismo más Lighthouse (accesibilidad < 0.9 falla) |
| Tag | `release.yml` | tag válido, alcanzable desde `main`, firmado, `VERSION` y `CHANGELOG` coherentes |
| Tras la release | `post-release-validation.yml` | producción sirve los archivos del tag y pasa la prueba de humo |

## Flujo de trabajo y release

Un tag es irreversible, así que cada workflow se prueba en verde mientras
el cambio aún se puede revertir.

1. Rama desde `main`, commits firmados, push y PR.
2. Esperar el CI del PR. Si algo sale rojo: leer el log
   (`gh run view <id> --log-failed`), corregir, push y volver a esperar.
   No descartar un fallo como inestable sin pruebas en el log.
3. Revisar la vista previa de Cloudflare Pages del PR.
4. Con todo en verde: squash merge (`main` exige PR e historial lineal).
5. Esperar el CI de `main` y el despliegue de Cloudflare Pages del commit
   del merge (checks del commit). Si algo sale rojo, se corrige en un PR
   nuevo antes de seguir.
6. PR de release `chore(release): vX.Y.Z`: `VERSION` con `X.Y.Z` y la
   sección `## [Unreleased]` del CHANGELOG renombrada a
   `## [X.Y.Z] - AAAA-MM-DD`, con su enlace de comparación al pie.
   Esperar su CI y hacer squash merge.
7. Etiquetar el **commit del merge en `main`**, no la punta de la rama
   (el squash cambia el SHA):

   ```bash
   git fetch origin main && git checkout main && git reset --hard origin/main
   cat VERSION                                  # X.Y.Z
   git tag -s vX.Y.Z -m "release: X.Y.Z" "$(git rev-parse origin/main)"
   git push origin vX.Y.Z
   [ "$(git rev-parse vX.Y.Z^{commit})" = "$(git rev-parse origin/main)" ] || echo "TAG HUÉRFANO"
   ```

8. Esperar `release.yml` y después `post-release-validation.yml`, que
   compara producción con el tag y corre la prueba de humo contra el
   sitio real.

Si un tag quedó en un commit fuera de `main`: borrarlo
(`git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z`) y volver al
paso 7.

## Firma de tags

`release.yml` verifica el tag con `.github/trusted-signers`, leído de
`origin/main` (no del árbol del tag) para que revocar una llave tenga
efecto en la siguiente release. Para comprobar un tag en local:

```bash
git -c gpg.format=ssh -c gpg.ssh.allowedsignersfile=.github/trusted-signers verify-tag vX.Y.Z
```
