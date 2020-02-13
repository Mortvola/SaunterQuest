<?php
namespace bpp;

class RouteIterator implements \Iterator
{
    private $route;
    private $routeIndex = 0;
    private $trailIndex = 0;

    public function __construct($route)
    {
        $this->route = $route;
        $this->routeIndex = 0;
        $this->trailIndex = -1;
    }

    public function current()
    {
        return [$this->getValue($this->routeIndex, $this->trailIndex), $this->nextValue()];
    }

    public function key()
    {
        return $this->routeIndex . ':' . $this->trailIndex;
    }

    public function next()
    {
        list($this->routeIndex, $this->trailIndex) = $this->nextPosition ();
    }

    public function rewind()
    {
        $this->routeIndex = 0;
        $this->trailIndex = -1;
    }

    public function valid()
    {
        list($routeIndex, $trailIndex) = $this->nextPosition ();

        return $this->isValid ($this->routeIndex, $this->trailIndex) && $this->isValid($routeIndex, $trailIndex);
    }


    private function nextValue()
    {
        list($routeIndex, $trailIndex) = $this->nextPosition ();

        return $this->getValue($routeIndex, $trailIndex);
    }

    private function isValid($routeIndex, $trailIndex)
    {
        if ($trailIndex != -1)
        {
            if (isset ($this->route[$routeIndex]))
            {
                if (isset($this->route[$routeIndex]->trail))
                {
                    return isset($this->route[$routeIndex]->trail[$trailIndex]);
                }

                return true;
            }

            return false;
        }

        return isset ($this->route[$routeIndex]);
    }

    private function getValue ($routeIndex, $trailIndex)
    {
        if ($this->isValid($routeIndex, $trailIndex))
        {
            if ($trailIndex != -1 &&
                isset ($this->route[$routeIndex]->trail))
            {
                return $this->route[$routeIndex]->trail[$trailIndex];
            }

            return $this->route[$routeIndex];
        }
    }

    private function nextPosition ()
    {
        if (isset ($this->route[$this->routeIndex]->trail))
        {
            if ($this->trailIndex >= count($this->route[$this->routeIndex]->trail) - 1)
            {
                return [$this->routeIndex + 1, -1];
            }

            return [$this->routeIndex, $this->trailIndex + 1];
        }

        return [$this->routeIndex + 1, -1];
    }

}
