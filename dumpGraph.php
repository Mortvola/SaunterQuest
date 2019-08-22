<?php
function dumpGraph($graph)
{
    $handle = fopen("graph.dot", "wb");

    if ($handle) {
        $deadEndCount = 0;

        fwrite($handle, "graph G {\n");

//      for ($i = 0; $i < count($graph->nodes); $i++)
//      {
//          $node = $graph->nodes[$i];

//          fwrite ($handle, "n" . $i . " [ pos = \"" . $node->lng * 400 . "," . $node->lat * 400 . "!\" ];\n");
//      }

        for ($i = 0; $i < count($graph->edges); $i++) {
            $edge = $graph->edges[$i];

            if (isset($edge->type) && $edge->type == "connector") {
                $color = ",color=red";
            } else {
                $color = "";
            }

            if (isset($edge->file)) {
                fwrite($handle, "n" . $edge->nodeIndex . " -- " . $edge->file . " [ " . $color . "];\n");
            } else {
                $label = "label = \"" . $edge->cn . ":" . $edge->route . "\"";

                if (isset($edge->prev->nodeIndex) && isset($edge->next->nodeIndex)) {
                    fwrite($handle, "n" . $edge->prev->nodeIndex . " -- n" . $edge->next->nodeIndex . " [ " . $label . $color . "];\n");
                } elseif (isset($edge->prev->nodeIndex)) {
                    $deadEndCount++;
                    fwrite($handle, "n" . $edge->prev->nodeIndex . " -- DE" . $deadEndCount . " [ " . $label . $color . "];\n");
                } elseif (isset($edge->next->nodeIndex)) {
                    $deadEndCount++;
                    fwrite($handle, "n" . $edge->next->nodeIndex . " -- DE" . $deadEndCount . " [ " . $label . $color . "];\n");
                }
            }
        }

        fwrite($handle, "}\n");

        fclose($handle);
    }
}


if (isset($argv[1])) {
    $graph = json_decode(file_get_contents($argv[1]));

    dumpGraph($graph);
}
