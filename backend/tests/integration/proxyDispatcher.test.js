import { describe, it, expect } from 'vitest';
import http from 'node:http';
import { ProxyAgent } from 'undici';

// `openFoodFacts.service.js` passe un `ProxyAgent` issu du paquet `undici` installé au
// `fetch` global de Node, qui embarque sa *propre* copie d'undici. Ce couplage n'est garanti
// par aucun contrat public : si les deux divergent, `fetch` rejette le dispatcher avec
// `UND_ERR_INVALID_ARG` et, derrière un proxy d'entreprise, plus aucun appel Open Food Facts
// n'aboutit. C'est le cas d'undici 8 avec Node 24, d'où le maintien en 6 — voir CLAUDE.md.
//
// Ce test ne vérifie pas que le proxy fonctionne (il faudrait un vrai proxy) : il vérifie
// que le dispatcher est *accepté*. C'est la seule partie que la montée de version casse.

describe('compatibilité du ProxyAgent avec le fetch global de Node', () => {
  it("n'est pas rejeté comme argument invalide", async () => {
    const serveur = http.createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{}');
    });
    await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
    const url = `http://127.0.0.1:${serveur.address().port}`;
    const dispatcher = new ProxyAgent(url);

    let causes = [];
    try {
      // Le serveur n'est pas un vrai proxy : l'appel n'aboutira pas, et c'est sans
      // importance. Seule la nature de l'échec compte.
      await fetch(url, { dispatcher, signal: AbortSignal.timeout(1000) });
    } catch (err) {
      for (let cur = err; cur; cur = cur.cause) {
        causes.push(cur.code || cur.name);
      }
    } finally {
      serveur.close();
      await dispatcher.close();
    }

    expect(
      causes,
      `undici rejette le dispatcher du fetch global : chaîne = ${causes.join(' <- ')}`,
    ).not.toContain('UND_ERR_INVALID_ARG');
  });
});
