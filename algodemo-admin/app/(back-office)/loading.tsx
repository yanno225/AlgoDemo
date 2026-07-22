/**
 * Squelette de chargement des sections du back-office.
 *
 * Placé au niveau du groupe : il couvre chaque première entrée dans une
 * section sans exiger un fichier par page. La silhouette reprend le rythme
 * réel des écrans — titre, rangée de cartes, grand bloc — pour que le
 * contenu semble se préciser plutôt qu'apparaître.
 */
export default function BackOfficeLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Chargement">
      {/* Titre et sous-titre de page */}
      <div className="space-y-3">
        <div className="h-9 w-64 rounded-lg bg-surface ring-1 ring-hairline" />
        <div className="h-4 w-96 max-w-full rounded-md bg-surface/70" />
      </div>

      {/* Rangée de cartes d'indicateurs */}
      <div className="grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-36 rounded-xl bg-surface shadow-sm ring-1 ring-hairline"
          />
        ))}
      </div>

      {/* Bloc principal */}
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="h-80 rounded-xl bg-surface shadow-sm ring-1 ring-hairline xl:col-span-2" />
        <div className="h-56 rounded-xl bg-surface shadow-sm ring-1 ring-hairline" />
      </div>
    </div>
  );
}
