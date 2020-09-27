<?php
namespace App;
require_once app_path('utilities.php');

use Illuminate\Support\Facades\Http;

class Elevation
{

    public function downloadFile ($point)
    {
        $baseFilename = $this->getBaseFilename ($point->lat, $point->lng);
        $filename = $baseFilename . ".hgt";

        $destFilename = base_path("elevations/" . $filename);
        $zipArchiveName = $baseFilename . ".SRTMGL1.hgt.zip";

        if (!file_exists($destFilename))
        {
            //$url = "https://dds.cr.usgs.gov/srtm/version2_1/SRTM1/Region_04/" . $filename . ".zip";
            $url = "https://e4ftl01.cr.usgs.gov/MEASURES/SRTMGL1.003/2000.02.11/" . $zipArchiveName;

            error_log ($url);

            $ch = curl_init($url);

            if ($ch)
            {
                $userPassword = env('ELE_USERNAME') . ':' . env('ELE_PASSWORD');

                curl_setopt($ch, CURLOPT_HEADER, false);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_FAILONERROR, true);
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                curl_setopt($ch, CURLOPT_UNRESTRICTED_AUTH, true);
                curl_setopt($ch, CURLOPT_COOKIEFILE, "");
                curl_setopt($ch, CURLOPT_USERPWD, $userPassword);
                //curl_setopt($ch, CURLOPT_VERBOSE, true);

                $result = curl_exec($ch);

                if ($result !== false)
                {
                    $destZipArchive = base_path("elevations/") . $zipArchiveName;

                    $fp = fopen($destZipArchive, "wb");

                    if ($fp)
                    {
                        fwrite($fp, $result);
                        fclose($fp);

                        $zip = new \ZipArchive;
                        $res = $zip->open($destZipArchive);
                        if ($res === TRUE)
                        {
                            $zip->extractTo(base_path("elevations/"), $filename);
                            $zip->close();
                        }

                        unlink ($destZipArchive);
                    }
                }
                else
                {
                    error_log("Could not open URL: " . $url);
                    error_log("error: " . curl_error($ch));
                }

                curl_close($ch);
            }
            else
            {
                error_log("Could not open URL: " . $url);
                error_log("error: " . curl_error($ch));
            }
        }
    }

    public function fillGaps ()
    {
        $di = new \DirectoryIterator (base_path("elevations/"));

        foreach ($di as $fileInfo)
        {
            if ($fileInfo->isFile ())
            {
                list($basename, $extension) = explode ('.', $fileInfo->getFileName ());

                if ($extension == 'hgt')
                {
                    $file = fopen(base_path("elevations/") . $fileInfo->getFileName (), "rb");

                    if ($file)
                    {
                        error_log ("Processing " . $fileInfo->getFileName ());

                        $data = fread ($file, 3601 * 3601 * 2);

                        fclose ($file);
                    }

                    $gapCount = 0;

                    for ($y = 0; $y < 3601; $y++)
                    {
                        for ($x = 0; $x < 3601; $x++)
                        {
                            $ele = unpack("n", substr($data, $y * 3601 + $x * 2, 2))[1];

                            if ($ele == 32768)
                            {
                                $gapCount++;
                            }
                        }
                    }

                    echo 'Number of gaps: ' . $gapCount . "\n";
                }
            }
        }
    }

    public function getElevation ($lat, $lng)
    {
        $response = Http::get(env('PATHFINDER_SERVER') . '/elevation/point?lat=' . $lat . '&lng=' . $lng);

        return $response->json()["ele"];
    }
}
