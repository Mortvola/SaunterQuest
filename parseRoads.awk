BEGIN {
	RS = "OGRFeature";
	FS = "\n";

	roadCount = 0;
#	printf "{ \"roads\" : ["
};

{

	roadCN = ""; roadRoute = "";

	for (i = 1; i <= NF; i++) {
	            if ($i ~ "RoadCore_FS") {
	                    split($i, subFields, ":");
	                    featureID = subFields[2];
	            }


		if ($i ~ "RTE_CN") {
			split($i, subFields, "[ ]*=[ ]*");
			roadCN = subFields[2];
		}

		if ($i ~ "MULTILINESTRING") {
			roadRoute = $i;
			
			gsub ("[ ]*MULTILINESTRING[ ]*", "", roadRoute);
		}
	}

	if (roadCN != "" && roadRoute != "")
	{
		#if (roadCount > 0)
		#{
			#printf ","
		#}
		roadCount++;
		
		segmentCount = split (roadRoute, segments, "\\),\\(");
		
		for (t = 1; t <= segmentCount; t++)
		{
			printf "{"
			printf "\"type\":\"road\",";
			printf "\"cn\":\"%s\",", roadCN;
			printf "\"feature\":\"%s\",", featureID;

			printf "\"route\":["

			gsub ("\\(", "", segments[t]);
			gsub ("\\)", "", segments[t]);
			count = split (segments[t], coords, ",");

			for (i = 1; i <= count; i++)
			{
				split (coords[i], comps, " ");

				if (i > 1)
				{
					printf ","
				}

				printf "{\"lat\":%s,\"lng\":%s}", comps[2], comps[1];
			}
			printf "]"

			printf "}\n"
		}

		#if (roadCount > 1)
		#{
			#exit;
		#}
	}
}

END {
#	printf "]}"
}
