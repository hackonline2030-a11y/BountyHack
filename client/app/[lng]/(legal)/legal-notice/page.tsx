import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  if (!isSupportedLanguage(lng) || lng !== "en") {
    return {};
  }
  const { t } = await getT("legal", { lng });
  return { title: t("notice.metaTitle") };
}

export default async function LegalNoticeEnPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng) || lng !== "en") {
    notFound();
  }

  return (
    <div className="mx-auto px-5 container">
      <div className="bg-white mx-auto my-5 p-6 rounded-lg max-w-4xl">
        <h1 className="mb-4 font-bold text-3xl text-gray-800">Legal Notice</h1>

        <section className="mb-4">
          <h2 className="mb-2 font-bold text-xl">Website under construction</h2>
          <p className="text-gray-800">
            This site is a demonstration site with demonstration articles that may relate
            sometimes real and sometimes fictitious facts. These articles should not be considered
            as actual opinions or news. The site is also not yet 100% compliant: this compliance
            work is in progress.
          </p>
          <p>
            The present legal notice is being updated. It is therefore not yet complete.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">Site publisher</h2>
          <p className="text-gray-600">
            The <strong>Bug Bounty App</strong> website is published by{" "}
            <strong>Mr. Jérémie EINHORNY</strong>, a sole proprietor (
            <em>entrepreneur individuel</em>) operating under the trade name « INGENIERIE ET
            CONCEPTION ».
            <br />
            <strong>Legal form:</strong> Sole proprietorship (<em>entrepreneur individuel</em>,
            unregulated liberal profession)
            <br />
            <strong>Registered office:</strong>{" "}
            <span className="inline not-italic">119 avenue de Lavaur, 81100 Castres, France</span>
            <br />
            <strong>SIREN:</strong> 505 280 313
            <br />
            <strong>SIRET (head office):</strong> 505 280 313 00048
            <br />
            <strong>APE code:</strong> 71.12B (Engineering, technical studies)
            <br />
            <strong>Intra-Community VAT number:</strong> FR29 505 280 313
            <br />
            <strong>Registered with the RNE (French National Business Register):</strong>{" "}
            21/07/2008
            <br />
            <strong>Phone:</strong> [To be filled in]
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">Publication director</h2>
          <p className="text-gray-600">
            <strong>Mr. Jérémie EINHORNY</strong>, in his capacity as sole proprietor and publisher
            of the website.
            <br />
            Email: [To be filled in]
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">Hosting</h2>
          <p className="text-gray-600">
            This website is hosted by <strong>LWS (Ligne Web Services)</strong>, a French SAS with
            share capital of €500,000, whose registered office is located at 10, rue Penthièvre,
            75008 Paris, France.
            <br />
            <strong>RCS:</strong> Paris B 851 993 683 00024
            <br />
            <strong>APE:</strong> 6311Z
            <br />
            <strong>SIRET:</strong> 851 993 683 00024
            <br />
            <strong>Intra-Community VAT:</strong> FR21 851 993 683
            <br />
            <strong>Phone hotline</strong> (Monday to Friday, 9:00 AM to 7:00 PM):{" "}
            <a href="tel:+33177623003" className="text-blue-500 hover:underline">
              01 77 62 30 03
            </a>{" "}
            (France) /{" "}
            <a href="tel:+33177623003" className="text-blue-500 hover:underline">
              +33 1 77 62 30 03
            </a>{" "}
            (International)
            <br />
            Visit the hosting provider&apos;s website:{" "}
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
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">Intellectual property</h2>
          <p className="text-gray-600">
            All content on this website (texts, images, videos, logos, etc.) is protected under
            the provisions of the French Intellectual Property Code and international copyright
            conventions.
            <br />
            All reproduction rights are reserved, including for iconographic and photographic
            materials.
            <br />
            Any total or partial reproduction of this site is prohibited without the express prior
            authorisation of Bug Bounty App.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">Personal data protection</h2>
          <p className="text-gray-600">
            In accordance with the French Data Protection Act (« Loi Informatique et Libertés »)
            of 6 January 1978, as amended, and with the General Data Protection Regulation (GDPR),
            we are committed to protecting the privacy of our users.
            <br />
            For more information on the processing of your personal data, please consult our{" "}
            <Link href={`/${lng}/privacy-policy`} className="text-blue-500 hover:underline">
              privacy policy
            </Link>
            .
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">Warranty and liability</h2>
          <p className="text-gray-600">
            The content of this website is published subject to technical and/or typographical
            errors, with non-contractual photographs.
            <br />
            <strong>Bug Bounty App</strong> cannot be held liable as to the accuracy of the
            information made available to users accessing the site.
            <br />
            Furthermore, Bug Bounty App cannot guarantee that the site will operate free of
            interruptions or errors.
            <br />
            The site designer or the individual or legal entity responsible for technical
            maintenance does not participate in the editing of content (articles, opinions, etc.)
            via the back office and cannot be held liable for content they did not edit.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">
            Applicable law and competent jurisdiction
          </h2>
          <p className="text-gray-600">
            This legal notice is governed by French law.
            <br />
            In the event of a dispute, and after seeking an amicable resolution, the French courts
            shall have exclusive jurisdiction to hear the dispute.
            <br />
            Unless otherwise stipulated, the{" "}
            <strong>Tribunal judiciaire de Castres</strong> (judicial court within the
            jurisdiction of the Cour d&apos;appel de Toulouse) shall have territorial jurisdiction.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-gray-700 text-xl">Credits and sources</h2>
          <p className="text-gray-600">
            The sources used on this site are listed on the following page:
            <Link
              className="text-blue-800 font-bold hover:text-blue-300"
              href={`/${lng}/credits`}
            >
              {" "}
              click here
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
