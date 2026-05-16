import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  if (!isSupportedLanguage(lng) || lng !== "fr") {
    return {};
  }
  const { t } = await getT("legal", { lng });
  return { title: t("notice.metaTitle") };
}

export default async function LegalNoticeFrPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng) || lng !== "fr") {
    notFound();
  }

  return (
    <div className="mx-auto px-5 container">
      <div className="bg-white mx-auto my-5 p-6 rounded-lg max-w-4xl">
        <h1 className="mb-4 font-bold text-3xl text-gray-800">Mentions Légales</h1>

        <section className="mb-4">
          <h2 className="mb-2 font-bold text-xl">Site en cours de conception</h2>
          <p className="text-gray-800">
            Ce site est un site de démonstration avec des articles de démonstration qui relate des
            faits parfois réels et parfois fictifs. Ne pas considérer ces articles comme des
            opinions ou actualités réelles. Le site n&apos;est pas non plus mis en conformité à
            100%: cette mise en conformité est en cours.
          </p>
          <p>
            Les présentes mentions légales sont en cours de mise à jour. Elles ne sont donc pas
            encore complètes.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">Éditeur du site</h2>
          <p className="text-gray-600">
            Le site <strong>Bug Bounty App</strong> est édité par{" "}
            <strong>M. Jérémie EINHORNY</strong>, entrepreneur individuel exerçant son activité
            sous l&apos;enseigne « INGENIERIE ET CONCEPTION ».
            <br />
            <strong>Forme juridique :</strong> Entrepreneur individuel (forme d&apos;exercice
            libérale non réglementée)
            <br />
            <strong>Siège social :</strong>{" "}
            <span className="inline not-italic">119 avenue de Lavaur, 81100 Castres, France</span>
            <br />
            <strong>SIREN :</strong> 505 280 313
            <br />
            <strong>SIRET (siège) :</strong> 505 280 313 00048
            <br />
            <strong>Code APE :</strong> 71.12B (Ingénierie, études techniques)
            <br />
            <strong>Numéro de TVA intracommunautaire :</strong> FR29 505 280 313
            <br />
            <strong>Inscription au RNE :</strong> 21/07/2008
            <br />
            <strong>Téléphone :</strong> [À renseigner]
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">Directeur de la publication</h2>
          <p className="text-gray-600">
            <strong>M. Jérémie EINHORNY</strong>, en sa qualité d&apos;entrepreneur individuel
            éditeur du site.
            <br />
            Email : [À renseigner]
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">Hébergement</h2>
          <p className="text-gray-600">
            Ce site est hébergé par la société <strong>LWS (Ligne Web Services)</strong>, SAS au
            capital de 500 000 €, dont le siège social est situé au 10, rue Penthièvre, 75008
            Paris, France.
            <br />
            <strong>RCS :</strong> Paris B 851 993 683 00024
            <br />
            <strong>APE :</strong> 6311Z
            <br />
            <strong>SIRET :</strong> 851 993 683 00024
            <br />
            <strong>TVA intracommunautaire :</strong> FR21 851 993 683
            <br />
            <strong>Hotline téléphonique</strong> (du lundi au vendredi, de 09h00 à 19h00) :{" "}
            <a href="tel:+33177623003" className="text-blue-500 hover:underline">
              01 77 62 30 03
            </a>{" "}
            (France) /{" "}
            <a href="tel:+33177623003" className="text-blue-500 hover:underline">
              +33 1 77 62 30 03
            </a>{" "}
            (International)
            <br />
            Accéder au site de la société d&apos;hébergement :{" "}
            <a
              href="https://www.lws.fr/"
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.lws.fr/
            </a>
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">Propriété intellectuelle</h2>
          <p className="text-gray-600">
            L&apos;ensemble du contenu présent sur ce site (textes, images, vidéos, logos, etc.)
            est protégé par les dispositions du Code de la propriété intellectuelle et par les
            conventions internationales relatives aux droits d&apos;auteur.
            <br />
            Tous les droits de reproduction sont réservés, y compris pour les documents
            iconographiques et photographiques.
            <br />
            Toute reproduction totale ou partielle de ce site est interdite sauf autorisation
            expresse préalable de Bug Bounty App.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">
            Protection des données personnelles
          </h2>
          <p className="text-gray-600">
            Conformément à la loi française « Informatique et Libertés » du 6 janvier 1978
            modifiée et au Règlement Général sur la Protection des Données (RGPD), nous nous
            engageons à protéger la vie privée de nos utilisateurs.
            <br />
            Pour plus d&apos;informations sur le traitement de vos données personnelles, consultez
            notre{" "}
            <Link
              href={`/${lng}/politique-de-confidentialite`}
              className="text-blue-500 hover:underline"
            >
              politique de confidentialité
            </Link>
            .
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">
            Garantie et responsabilité
          </h2>
          <p className="text-gray-600">
            Le contenu de ce site est édité sous réserve d&apos;erreurs techniques et/ou
            typographiques, avec des photos non contractuelles.
            <br />
            <strong>Bug Bounty App</strong> ne saurait être tenue responsable quant à
            l&apos;exactitude des informations mises à disposition des utilisateurs accédant au
            site.
            <br />
            En outre, Bug Bounty App ne peut garantir que le fonctionnement du site sera exempt
            d&apos;interruptions ou d&apos;erreurs.
            <br />
            Le concepteur du site ou la personne physique ou morale qui assure la maintenance
            technique n&apos;intervient pas dans la rédaction du contenu (articles, opinions...)
            via le back-office et ne saurait être tenu responsable du contenu qu&apos;il n&apos;a
            pas édité.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">
            Droit applicable et juridiction compétente
          </h2>
          <p className="text-gray-600">
            Les présentes mentions légales sont régies par le droit français.
            <br />
            En cas de litige, et après recherche d&apos;une solution amiable, les tribunaux
            français seront seuls compétents pour connaître du litige.
            <br />
            À défaut de stipulation contraire, le <strong>Tribunal judiciaire de Castres</strong>{" "}
            (ressort de la Cour d&apos;appel de Toulouse) sera territorialement compétent.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">Crédits et sources</h2>
          <p className="text-gray-600">
            Les sources utilisées sur ce site sont listées dans la
            page suivante:
            <Link
              className="text-blue-800 font-bold hover:text-blue-300"
              href={`/${lng}/credits`}
            >
              {" "}
              cliquez ici
            </Link>
          </p>
        </section>

      </div>
    </div>
  );
}
