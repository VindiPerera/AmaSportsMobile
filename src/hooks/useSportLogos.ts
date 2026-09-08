import { useCallback, useState } from 'react';
import { playerService } from '../services/playerService';
import { PickedImage } from '../types';

export function useSportLogos(sportSlug: string) {
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  const [collegeLogoUrl, setCollegeLogoUrl] = useState<string | null>(null);

  const initLogos = useCallback(
    (
      rawTeamLogos?: { team_name: string; logo_url: string }[] | Record<string, string> | null,
      rawCollegeLogoUrl?: string | null
    ) => {
      if (rawTeamLogos) {
        if (Array.isArray(rawTeamLogos)) {
          setTeamLogos(
            Object.fromEntries(rawTeamLogos.map((l) => [l.team_name, l.logo_url]))
          );
        } else {
          setTeamLogos(rawTeamLogos);
        }
      } else {
        setTeamLogos({});
      }

      setCollegeLogoUrl(rawCollegeLogoUrl ?? null);
    },
    []
  );

  const handleUploadCollegeLogo = useCallback(
    async (image: PickedImage) => {
      const uploaded = await playerService.uploadCollegeLogo(image, sportSlug);
      setCollegeLogoUrl(uploaded.college_logo_url);
    },
    [sportSlug]
  );

  const handleRemoveCollegeLogo = useCallback(async () => {
    setCollegeLogoUrl(null);
    try {
      await playerService.removeCollegeLogo(sportSlug);
    } catch {
      // Best-effort cleanup
    }
  }, [sportSlug]);

  const handleUploadTeamLogo = useCallback(
    async (teamName: string, image: PickedImage) => {
      const uploaded = await playerService.uploadTeamLogo(teamName, image, sportSlug);
      setTeamLogos((prev) => ({ ...prev, [uploaded.team_name]: uploaded.logo_url }));
    },
    [sportSlug]
  );

  const handleRemoveTeamLogo = useCallback(
    async (teamName: string) => {
      setTeamLogos((prev) => {
        const next = { ...prev };
        delete next[teamName];
        return next;
      });
      try {
        await playerService.removeTeamLogo(teamName, sportSlug);
      } catch {
        // Best-effort cleanup
      }
    },
    [sportSlug]
  );

  return {
    teamLogos,
    setTeamLogos,
    collegeLogoUrl,
    setCollegeLogoUrl,
    initLogos,
    handleUploadCollegeLogo,
    handleRemoveCollegeLogo,
    handleUploadTeamLogo,
    handleRemoveTeamLogo,
  };
}
