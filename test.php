<?php
	$a = ['a', 'b', 'c', 'd'];

	var_dump ($a);

	echo json_encode ($a);

    for ($i = 0; $i < count($a); $i++)
    {
	if ($a[$i] == 'c')
	{
	    unset ($a[$i]);
	}
    }

	var_dump ($a);
	echo json_encode ($a);

	$a = array_values($a);
	echo json_encode ($a);
