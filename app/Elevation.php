<?php
namespace App;

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
        $filename = $this->getBaseFilename ($lat,$lng);

        $fullFilename = base_path("elevations/" . $filename . ".hgt");

        if (file_exists($fullFilename))
        {
            $file = fopen($fullFilename, "rb");

            $ele = [ ];

            if ($file)
            {
                list ($row, $col) = $this->getFilePosition ($lat, $lng);

                $result = fseek($file, $row * 3601 * 2 + $col * 2);

                // Read the upper left elevation
                $data = fread($file, 2);
                $ele[2] = unpack("n", $data)[1];

                // Read the upper right elevation;
                $data = fread($file, 2);
                $ele[3] = unpack("n", $data)[1];

                // Move to the lower left
                $result = fseek($file, ($row + 1) * 3601 * 2 + $col * 2);

                // read the lower left
                $data = fread($file, 2);
                $ele[0] = unpack("n", $data)[1];

                // read the lower right
                $data = fread($file, 2);
                $ele[1] = unpack("n", $data)[1];

                fclose($file);

                return round($this->findPoint($ele, $lng, $lat));
            }
        }
    }

    private function getBaseFileName ($lat, $lng)
    {
        // Determine file name
        $latInt = abs(floor($lat));
        $lngInt = abs(floor($lng));

        if ($lat >= 0)
        {
            $latPrefix = "N";

            $row = floor(($latInt + 1 - $lat) * 3600);
        }
        else
        {
            $latPrefix = "S";

            $row = floor(($latInt - 1 - $lat) * 3600);
        }

        if ($lng >= 0)
        {
            $lngPrefix = "E";

            $col = floor(($lng - $lngInt) * 3600);
        }
        else
        {
            $lngPrefix = "W";

            $col = floor(($lng + $lngInt) * 3600);
        }

        return $latPrefix . $latInt . $lngPrefix . $lngInt;
    }

    private function getFilePosition ($lat, $lng)
    {
        // Determine file name
        $latInt = abs(floor($lat));
        $lngInt = abs(floor($lng));

        if ($lat >= 0)
        {
            $row = floor(($latInt + 1 - $lat) * 3600);
        }
        else
        {
            $row = floor(($latInt - 1 - $lat) * 3600);
        }

        if ($lng >= 0)
        {
            $col = floor(($lng - $lngInt) * 3600);
        }
        else
        {
            $col = floor(($lng + $lngInt) * 3600);
        }

        return [$row, $col];
    }

    private function normalize ($x, $y)
    {
        return (object)[
            "x" => $x * 3600 - floor($x * 3600),
            "y" => $y * 3600 - floor($y * 3600)
        ];
    }

    private function getElevationUpper ($z1, $z2, $z3, $x, $y)
    {
        return ($z3 - $z1) * $x + ($z1 + $z3 - 2 * $z2) * $y - ($z3 - 2 * $z2);
    }

    private function getElevationLeft ($z1, $z2, $z3, $x, $y)
    {
        return $z1 - ($z1 - $z3) * $y - ($z1 + $z3 - 2 * $z2) * $x;
    }

    private function getElevationRight ($z1, $z2, $z3, $x, $y)
    {
        return ($z1 - $z3) * $y + ($z3 + $z1 - 2 * $z2) * $x - ($z1 - 2 * $z2);
    }

    private function getElevationLower ($z1, $z2, $z3, $x, $y)
    {
        return $z3 - ($z3 - $z1) * $x - ($z3 + $z1 - 2 * $z2) * $y;
    }

    private function findPoint ($ele, $x, $y)
    {
        // Find the elevation of the midpiont by taking the average of the
        // elevation between the midpoints of the two lines upperLeft to
        // lowerRight
        // and lowerLeft to upperRight
        $midElevation = (($ele[1] + ($ele[2] - $ele[1]) / 2) + ($ele[0] + ($ele[3] - $ele[0]) / 2)) / 2;

        $p = $this->normalize($x, $y);

        if ($p->x > $p->y)
        {
            // Lower right

            if (1 - $p->x > $p->y)
            {
                return $this->getElevationLower($ele[1], $midElevation, $ele[0], $p->x, $p->y);
            }
            else
            {
                return $this->getElevationRight($ele[3], $midElevation, $ele[1], $p->x, $p->y);
            }
        }
        else
        {
            // Upper left

            if (1 - $p->x >= $p->y)
            {
                return $this->getElevationLeft($ele[0], $midElevation, $ele[2], $p->x, $p->y);
            }
            else
            {
                return $this->getElevationUpper($ele[2], $midElevation, $ele[3], $p->x, $p->y);
            }
        }
    }
}
