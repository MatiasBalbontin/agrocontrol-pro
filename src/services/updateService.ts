export interface GitHubCommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  htmlUrl: string;
}

export interface UpdateCheckResult {
  success: boolean;
  status: 'UP_TO_DATE' | 'UPDATE_AVAILABLE' | 'EMPTY_REPO' | 'ERROR';
  repoUrl: string;
  latestCommit?: GitHubCommitInfo;
  message: string;
  checkedAt: string;
  pullCommand: string;
}

const DEFAULT_REPO_URL = 'https://github.com/MatiasBalbontin/agrocontrol-pro';

/**
 * Consulta la API pública de GitHub para el repositorio anclado
 * https://github.com/MatiasBalbontin/agrocontrol-pro
 */
export async function checkRepositoryUpdates(
  repoUrl: string = DEFAULT_REPO_URL,
  currentSha?: string
): Promise<UpdateCheckResult> {
  const timestamp = new Date().toLocaleString('es-CL');
  const pullCommand = 'git pull origin main';

  try {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (!match) {
      return {
        success: false,
        status: 'ERROR',
        repoUrl,
        message: 'La URL del repositorio no es válida.',
        checkedAt: timestamp,
        pullCommand,
      };
    }

    const owner = match[1];
    const repo = match[2];

    // 1. Verificar metadata del repositorio
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!repoResponse.ok) {
      if (repoResponse.status === 404) {
        return {
          success: false,
          status: 'ERROR',
          repoUrl,
          message: `El repositorio ${owner}/${repo} no fue encontrado o es privado.`,
          checkedAt: timestamp,
          pullCommand,
        };
      }
      return {
        success: false,
        status: 'ERROR',
        repoUrl,
        message: `Error al consultar GitHub (HTTP ${repoResponse.status}).`,
        checkedAt: timestamp,
        pullCommand,
      };
    }

    // 2. Obtener el commit más reciente de la rama principal
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    // Caso: Repositorio nuevo sin commits (HTTP 409 Git Repository is empty)
    if (commitsResponse.status === 409) {
      return {
        success: true,
        status: 'EMPTY_REPO',
        repoUrl,
        message: 'Repositorio conectado exitosamente. El repositorio está inicializado en GitHub y listo para recibir el código.',
        checkedAt: timestamp,
        pullCommand,
      };
    }

    if (!commitsResponse.ok) {
      return {
        success: false,
        status: 'ERROR',
        repoUrl,
        message: `No se pudieron leer los commits del repositorio (HTTP ${commitsResponse.status}).`,
        checkedAt: timestamp,
        pullCommand,
      };
    }

    const commitsData = await commitsResponse.json();

    if (!Array.isArray(commitsData) || commitsData.length === 0) {
      return {
        success: true,
        status: 'EMPTY_REPO',
        repoUrl,
        message: 'Repositorio conectado. Aún no registra commits en la rama principal.',
        checkedAt: timestamp,
        pullCommand,
      };
    }

    const latest = commitsData[0];
    const fullSha = latest.sha as string;
    const shortSha = fullSha.substring(0, 7);
    const message = (latest.commit?.message || 'Sin mensaje').split('\n')[0];
    const author = latest.commit?.author?.name || 'Autor desconocido';
    const dateRaw = latest.commit?.author?.date || '';
    const dateFormatted = dateRaw ? new Date(dateRaw).toLocaleString('es-CL') : 'Fecha no informada';
    const htmlUrl = latest.html_url || `https://github.com/${owner}/${repo}/commit/${fullSha}`;

    const latestCommit: GitHubCommitInfo = {
      sha: fullSha,
      shortSha,
      message,
      author,
      date: dateFormatted,
      htmlUrl,
    };

    const hasNewCommit = Boolean(currentSha && currentSha !== shortSha && currentSha !== fullSha);

    return {
      success: true,
      status: hasNewCommit ? 'UPDATE_AVAILABLE' : 'UP_TO_DATE',
      repoUrl,
      latestCommit,
      message: hasNewCommit
        ? `¡Nueva versión disponible en GitHub! Commit [${shortSha}]: "${message}"`
        : `Sistema verificado. Último commit en GitHub: [${shortSha}] - "${message}" (${dateFormatted})`,
      checkedAt: timestamp,
      pullCommand,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'ERROR',
      repoUrl,
      message: err?.message || 'Error de conexión de red al intentar conectar con GitHub.',
      checkedAt: timestamp,
      pullCommand,
    };
  }
}
