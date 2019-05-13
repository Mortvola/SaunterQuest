BEGIN {
	RS = "OGRFeature";
	FS = "\n";

	trailCount = 0;
#	printf "{ \"trails\" : ["
};

{

	trailNO = ""; trailCN = ""; trailRoute = "";

	for (i = 1; i <= NF; i++) {
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

		if ($i ~ "MULTILINESTRING") {
			trailRoute = $i;
			
			gsub ("[ ]*MULTILINESTRING[ ]*", "", trailRoute);
			gsub ("\\(", "", trailRoute);
			gsub ("\\)", "", trailRoute);
		}
	}

	if (trailNO != "" && trailCN != "" && trailRoute != "")
	{
		#if (trailCount > 0)
		#{
			#printf ","
		#}
		trailCount++;

		printf "{"
		printf "\"number\" : \"%s\",", trailNO;
		printf "\"cn\" : \"%s\",", trailCN;
		printf "\"name\" : \"%s\",", trailName;

		printf "\"route\" : ["

		count = split (trailRoute, coords, ",");

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

		#if (trailCount > 1)
		#{
			#exit;
		#}
	}
}

END {
#	printf "]}"
}
