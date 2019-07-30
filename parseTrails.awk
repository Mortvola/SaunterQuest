BEGIN {
	RS = "OGRFeature";
	FS = "\n";

	trailCount = 0;
#	printf "{ \"trails\":["
};

{

	trailNO = ""; trailCN = ""; trailRoute = "";

	for (i = 1; i <= NF; i++) {
		if ($i ~ "TrailNFS_Publish") {
			split($i, subFields, ":");
			featureID = subFields[2];
		}

		if ($i ~ "TRAIL_NO") {
			split($i, subFields, "[ ]*=[ ]*");
			trailNO = subFields[2];
		}

		if ($i ~ "TRAIL_CN") {
			split($i, subFields, "[ ]*=[ ]*");
			trailCN = subFields[2];
		}

		if ($i ~ "TRAIL_NAME") {
			split($i, subFields, "[ ]*=[ ]*");
			trailName = subFields[2];
			gsub ("\"", "", trailName);
		}

		if ($i ~ "TRAIL_TYPE") {
			split($i, subFields, "[ ]*=[ ]*");
			trailType = subFields[2];
			gsub ("\"", "", trailType);
		}

		if ($i ~ "MULTILINESTRING") {
			trailRoute = $i;
			
			gsub ("[ ]*MULTILINESTRING[ ]*", "", trailRoute);
		}
	}

	if (trailType != "SNOW" && trailNO != "" && trailCN != "" && trailRoute != "")
	{
		#if (trailCount > 0)
		#{
			#printf ","
		#}
		trailCount++;

		trailSegmentCount = split (trailRoute, trailSegments, "\\),\\(");
		
		for (t = 1; t <= trailSegmentCount; t++)
		{
			printf "{"
			printf "\"type\":\"trail\",";
			printf "\"cn\":\"%s\",", trailCN;
			printf "\"feature\":\"%s\",", featureID;
			printf "\"number\":\"%s\",", trailNO;
			printf "\"name\":\"%s\",", trailName;
			printf "\"surface\":\"%s\",", trailType;
	
			printf "\"route\":["
	
			gsub ("\\(", "", trailSegments[t]);
			gsub ("\\)", "", trailSegments[t]);
			count = split (trailSegments[t], coords, ",");
	
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

		#if (trailCount > 1)
		#{
			#exit;
		#}
	}
}

END {
#	printf "]}"
}
