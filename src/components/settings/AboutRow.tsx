import { t } from '../../state/locale';

const REPOSITORY = 'https://github.com/sasaplus1/ambient';
const SITE = 'https://sasaplus1.github.io/ambient';
const OPEN_METEO = 'https://open-meteo.com/';
const CC_BY = 'https://creativecommons.org/licenses/by/4.0/';

type LinkRowProps = {
  label: string;
  href: string;
  text: string;
};

function LinkRow({ label, href, text }: LinkRowProps) {
  return (
    <a
      class="setting-row"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <span class="setting-row__label">{label}</span>
      <span class="setting-row__value">{text}</span>
    </a>
  );
}

/**
 * What this is, and what it is built on.
 *
 * The weather entry is not decoration: Open-Meteo offers its data under CC BY
 * 4.0, which asks for attribution, and a dashboard with no interface of its own
 * has nowhere else to put it.
 *
 * The build line names the commit, so a device that has been running for days
 * can say which version it is showing without being plugged into anything.
 */
export function AboutRow() {
  return (
    <>
      <LinkRow
        label={t('about.repository')}
        href={REPOSITORY}
        text="sasaplus1/ambient"
      />
      <LinkRow
        label={t('about.site')}
        href={SITE}
        text="sasaplus1.github.io/ambient"
      />

      <div class="setting-row">
        <span class="setting-row__label">{t('about.build')}</span>
        <span class="setting-row__value">{__COMMIT_SHA__}</span>
      </div>

      <LinkRow
        label={t('about.weatherData')}
        href={OPEN_METEO}
        text="Open-Meteo"
      />
      <LinkRow
        label={t('about.weatherLicence')}
        href={CC_BY}
        text="CC BY 4.0"
      />

      <div class="setting-row">
        <span class="setting-row__label">{t('about.licence')}</span>
        <span class="setting-row__value">MIT</span>
      </div>
    </>
  );
}
