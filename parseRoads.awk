BEGIN {
	RS = "OGRFeature";
	FS = "\n";

	roadCount = 0;
#	printf "{ \"roads\" : ["
};

{

	roadCN = ""; roadRoute = "";

	for (i = 1; i <= NF; i++) {

		if ($i ~ "RTE_CN") {
			split($i, subFields, "[ ]*=[ ]*");
			roadCN = subFields[2];
		}

		if ($i ~ "MULTILINESTRING") {
			roadRoute = $i;
			
			gsub ("[ ]*MULTILINESTRING[ ]*", "", roadRoute);
			gsub ("\\(", "", roadRoute);
			gsub ("\\)", "", roadRoute);
		}
	}

	if (roadCN != "" && roadRoute != "")
	{
		#if (roadCount > 0)
		#{
			#printf ","
		#}
		roadCount++;

		printf "{"
		printf "\"cn\" : \"%s\",", roadCN;

		printf "\"route\" : ["

		count = split (roadRoute, coords, ",");

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

		#if (roadCount > 1)
		#{
			#exit;
		#}
	}
}

END {
#	printf "]}"
}
